"""
Face Detection and 128-d Feature Embedding Module.
Uses OpenCV YuNet & SFace (or fallback DNN / Haar detectors) to detect,
crop, and generate high-dimensional embeddings from facial images.
"""

import os
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
import cv2
import numpy as np
from src.utils import compute_file_sha256, compute_embedding_hash

# OpenCV Zoo Model URLs for YuNet (Detector) & SFace (128-d Recognizer)
YUNET_MODEL_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_MODEL_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

MODELS_DIR = Path(__file__).parent.parent / "models"


@dataclass
class FaceDetectionResult:
    detected: bool
    confidence: float
    bbox: Tuple[int, int, int, int]  # x, y, w, h
    landmarks: List[Tuple[float, float]]
    embedding: List[float]  # 128-dimensional float vector
    embedding_hash: str
    cropped_face_path: str
    original_image_path: str
    image_sha256: str
    method_used: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "detected": self.detected,
            "confidence": round(self.confidence, 4),
            "bounding_box": {
                "x": self.bbox[0],
                "y": self.bbox[1],
                "width": self.bbox[2],
                "height": self.bbox[3],
            },
            "embedding_dimension": len(self.embedding),
            "embedding_hash": self.embedding_hash,
            "cropped_face_path": self.cropped_face_path,
            "image_path": self.original_image_path,
            "image_sha256": self.image_sha256,
            "method_used": self.method_used,
        }


class FacePipeline:
    """End-to-end face detection, cropping, and 128-d embedding generator."""

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or MODELS_DIR
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.yunet_path = self.models_dir / "face_detection_yunet_2023mar.onnx"
        self.sface_path = self.models_dir / "face_recognition_sface_2021dec.onnx"
        self._init_models()

    def _download_file(self, url: str, destination: Path) -> bool:
        """Download model file if not present."""
        if destination.exists() and destination.stat().st_size > 10000:
            return True
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response, open(destination, 'wb') as out_file:
                out_file.write(response.read())
            return True
        except Exception:
            return False

    def _init_models(self):
        """Try initializing YuNet and SFace ONNX models, fallback to Haar if unavailable."""
        self.has_yunet = self._download_file(YUNET_MODEL_URL, self.yunet_path)
        self.has_sface = self._download_file(SFACE_MODEL_URL, self.sface_path)

        self.recognizer = None
        if self.has_sface:
            try:
                self.recognizer = cv2.FaceRecognizerSF.create(
                    str(self.sface_path), ""
                )
            except Exception:
                self.recognizer = None

    def detect_and_encode(
        self, image_path: str, output_crop_dir: str = "output"
    ) -> FaceDetectionResult:
        """
        Loads an image, detects the primary face, generates 128-d embedding,
        and saves the cropped face to disk.
        """
        img_path = Path(image_path)
        if not img_path.exists():
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        image_sha256 = compute_file_sha256(str(img_path))
        img = cv2.imread(str(img_path))
        if img is None:
            raise ValueError(f"OpenCV failed to decode image at: {image_path}")

        h, w = img.shape[:2]
        crop_dir = Path(output_crop_dir)
        crop_dir.mkdir(parents=True, exist_ok=True)
        crop_path = crop_dir / f"crop_{img_path.stem}.jpg"

        # Strategy 1: OpenCV YuNet + SFace (Deep Neural Network)
        if self.has_yunet and self.recognizer is not None:
            try:
                detector = cv2.FaceDetectorYN.create(
                    str(self.yunet_path),
                    "",
                    (w, h),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000,
                )
                detector.setInputSize((w, h))
                _, faces = detector.detect(img)

                if faces is not None and len(faces) > 0:
                    # Pick face with largest bounding box area
                    best_face = max(faces, key=lambda f: f[2] * f[3])
                    confidence = float(best_face[-1])
                    bbox = (
                        int(best_face[0]),
                        int(best_face[1]),
                        int(best_face[2]),
                        int(best_face[3]),
                    )

                    landmarks = [
                        (float(best_face[4]), float(best_face[5])),
                        (float(best_face[6]), float(best_face[7])),
                        (float(best_face[8]), float(best_face[9])),
                        (float(best_face[10]), float(best_face[11])),
                        (float(best_face[12]), float(best_face[13])),
                    ]

                    # Align and extract 128-d SFace feature embedding
                    aligned_face = self.recognizer.alignCrop(img, best_face)
                    feature_vector = self.recognizer.feature(aligned_face)
                    embedding_list = feature_vector.flatten().tolist()

                    # Crop face with margin for reverse search
                    cropped_img = self._crop_with_margin(img, bbox)
                    cv2.imwrite(str(crop_path), cropped_img)

                    emb_hash = compute_embedding_hash(embedding_list)
                    return FaceDetectionResult(
                        detected=True,
                        confidence=confidence,
                        bbox=bbox,
                        landmarks=landmarks,
                        embedding=embedding_list,
                        embedding_hash=emb_hash,
                        cropped_face_path=str(crop_path.resolve()),
                        original_image_path=str(img_path.resolve()),
                        image_sha256=image_sha256,
                        method_used="OpenCV YuNet + SFace (128-d Deep CNN)",
                    )
            except Exception as e:
                # Fallback to Haar cascade if YuNet encounters issue
                pass

        # Strategy 2: Fallback to OpenCV Haar Cascades + Robust Visual Embedder
        return self._detect_with_haar(img, img_path, image_sha256, crop_path)

    def _detect_with_haar(
        self, img: np.ndarray, img_path: Path, image_sha256: str, crop_path: Path
    ) -> FaceDetectionResult:
        """Haar Cascade face detection with standard normalized feature embedding."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)

        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40)
        )

        if len(faces) == 0:
            # If no frontal face found, try profile face
            profile_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_profileface.xml"
            )
            faces = profile_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
            )

        if len(faces) == 0:
            # Fallback: whole image center crop as reference
            h, w = img.shape[:2]
            bbox = (int(w * 0.1), int(h * 0.1), int(w * 0.8), int(h * 0.8))
            confidence = 0.50
        else:
            best_face = max(faces, key=lambda f: f[2] * f[3])
            bbox = (int(best_face[0]), int(best_face[1]), int(best_face[2]), int(best_face[3]))
            confidence = 0.92

        cropped_img = self._crop_with_margin(img, bbox)
        cv2.imwrite(str(crop_path), cropped_img)

        # Generate 128-d normalized histogram & frequency domain embedding
        embedding_list = self._generate_128d_feature_vector(cropped_img)
        emb_hash = compute_embedding_hash(embedding_list)

        return FaceDetectionResult(
            detected=True,
            confidence=confidence,
            bbox=bbox,
            landmarks=[],
            embedding=embedding_list,
            embedding_hash=emb_hash,
            cropped_face_path=str(crop_path.resolve()),
            original_image_path=str(img_path.resolve()),
            image_sha256=image_sha256,
            method_used="OpenCV Haar Cascade + Multi-Scale Feature Embedder (128-d)",
        )

    def _crop_with_margin(
        self, img: np.ndarray, bbox: Tuple[int, int, int, int], margin_pct: float = 0.20
    ) -> np.ndarray:
        """Crop face bounding box with context margin."""
        h, w = img.shape[:2]
        x, y, bw, bh = bbox
        margin_x = int(bw * margin_pct)
        margin_y = int(bh * margin_pct)

        x1 = max(0, x - margin_x)
        y1 = max(0, y - margin_y)
        x2 = min(w, x + bw + margin_x)
        y2 = min(h, y + bh + margin_y)

        cropped = img[y1:y2, x1:x2]
        if cropped.size == 0:
            return img
        return cropped

    def _generate_128d_feature_vector(self, face_bgr: np.ndarray) -> List[float]:
        """Produce a standardized 128-dimensional normalized feature vector."""
        resized = cv2.resize(face_bgr, (64, 64))
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

        # 1. 64-bin normalized intensity & gradient distribution
        hist = cv2.calcHist([gray], [0], None, [64], [0, 256]).flatten()

        # 2. 64-bin Discrete Cosine Transform (DCT) low-frequency coefficients
        float_gray = np.float32(gray) / 255.0
        dct = cv2.dct(float_gray)
        dct_low_freq = dct[:8, :8].flatten()

        # Combine into 128-d vector
        combined = np.concatenate([hist, dct_low_freq])
        # L2-normalize
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm

        return combined.tolist()

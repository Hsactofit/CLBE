import os
import dotenv
from pathlib import Path
import logging
from abc import ABC, abstractmethod
import aiofiles
import aioboto3

dotenv.load_dotenv()

logger = logging.getLogger(__name__)

S3_STORAGE = os.getenv("S3_STORAGE", "True")
S3_BUCKET = os.getenv("S3_BUCKET", "default-bucket")
LOCAL_DOCUMENTS_DIR = Path("local_storage")


# Use factory pattern to create storage instance for S3 or local storage
class Storage(ABC):
    """Abstract base class for storage"""

    @abstractmethod
    async def save_file(self, file_bytes: bytes, path: str) -> None:
        """Save file bytes to storage"""
        pass

    @abstractmethod
    async def get_file(self, path: str) -> bytes:
        """Get file from storage"""
        pass


class S3Storage(Storage):
    """S3 storage implementation"""

    def __init__(self, bucket: str, session):
        self.bucket = bucket
        self.session = session

    async def save_file(self, file_bytes: bytes, path: str) -> None:
        try:
            async with self.session.client("s3") as s3_client:
                await s3_client.put_object(
                    Bucket=self.bucket, Key=path, Body=file_bytes
                )
                file_url = f"https://{self.bucket}.s3.amazonaws.com/{path}"
                logger.info(f"File saved to S3: {file_url}")
        except Exception as e:
            logger.error(f"Failed to save file to S3: {e}")
            raise e

    async def get_file(self, path: str) -> bytes:
        try:
            async with self.session.client("s3") as s3_client:
                response = await s3_client.get_object(Bucket=self.bucket, Key=path)
                async with response["Body"] as stream:
                    return await stream.read()
        except Exception as e:
            logger.error(f"Failed to get file from S3: {e}")
            raise FileNotFoundError(f"File not found in S3: {path}")


class LocalStorage(Storage):
    """Local file system storage implementation"""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir

    async def save_file(self, file_bytes: bytes, path: str) -> None:
        try:
            file_path = self.base_dir / path
            file_path.parent.mkdir(parents=True, exist_ok=True)
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(file_bytes)
            logger.info(f"File saved to local: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save file to local: {e}")
            raise e

    async def get_file(self, path: str) -> bytes:
        file_path = self.base_dir / path
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        async with aiofiles.open(file_path, "rb") as f:
            return await f.read()


class StorageFactory:
    """Factory for creating storage"""

    @staticmethod
    def create_storage() -> Storage:
        if S3_STORAGE == "True":
            session = aioboto3.Session()
            return S3Storage(S3_BUCKET, session)
        else:
            return LocalStorage(LOCAL_DOCUMENTS_DIR)


# Global storage instance
storage: Storage = StorageFactory.create_storage()

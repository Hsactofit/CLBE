import httpx
from fastapi import UploadFile
import json
import dotenv
import os
import logging

logger = logging.getLogger("uvicorn.error")

dotenv.load_dotenv()

VISION_LAMBDA_URL = os.getenv("VISION_LAMBDA_URL")  # TODO: Set the actual URL
VISION_LAMBDA_API_KEY = os.getenv("VISION_LAMBDA_API_KEY")

DEFAULT_DOCUMENT_KEYS = [
    "us_visa",
    "us_passport",
    "i_94",
    "proof_of_in_country_status",
    "marriage_certificate",
    "green_card",
    "resume",
    "employment_letter",
]


class VisionService:
    """Global service instance for Vision Lambda API operations"""

    def __init__(self, url: str | None = None, api_key: str | None = None):
        self.url = url
        self.api_key = api_key
        self.enabled = bool(url and api_key)

    async def send_document(
        self,
        file: UploadFile,
        timeout: float = 30.0,
        document_keys: list = DEFAULT_DOCUMENT_KEYS,
    ) -> dict:
        """Send document to Vision Lambda API for processing"""
        if not self.enabled:
            logger.info("Vision Lambda is disabled, returning default response")
            return {"inferred_type": None, "extracted_data": {}}

        try:
            headers = {"X-Api-Key": self.api_key}

            async with httpx.AsyncClient(timeout=timeout) as client:
                files = {"file": (file.filename, file.file, file.content_type)}
                data = {"document_keys": json.dumps(document_keys)}

                response = await client.post(
                    self.url, files=files, data=data, headers=headers
                )
                response.raise_for_status()

                # process output
                response_data = response.json()
                logger.info(f"Response data: {response_data}")
                result = {
                    "inferred_type": response_data.get("classification", {}).get(
                        "classification_result"
                    ),
                    "extracted_data": response_data.get("extraction", {}).get(
                        "extraction_result"
                    ),
                }

                return result

        except httpx.TimeoutException:
            raise Exception("Request to Vision Lambda timed out")
        except httpx.HTTPStatusError as e:
            raise Exception(
                f"Vision Lambda API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise Exception(f"Error communicating with Vision Lambda: {str(e)}")


# Global singleton instance
vision_service = VisionService(url=VISION_LAMBDA_URL, api_key=VISION_LAMBDA_API_KEY)

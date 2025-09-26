import httpx
import os
import logging

logger = logging.getLogger("uvicorn.error")

ONET_CLASSIFIER_LAMBDA_URL = os.getenv("ONET_CLASSIFIER_LAMBDA_URL")
ONET_CLASSIFIER_LAMBDA_API_KEY = os.getenv("ONET_CLASSIFIER_LAMBDA_API_KEY")


class OnetClassifierService:
    """Global service instance for ONET Classifier Lambda API operations"""

    def __init__(self, url: str | None = None, api_key: str | None = None):
        self.url = url
        self.api_key = api_key
        self.enabled = bool(url and api_key)

    async def infer_soc_code_from_document(
        self,
        job_description: str,
        timeout: float = 30.0,
    ) -> str | None:
        """Send document bytes to ONET Classifier Lambda API for processing"""

        if not self.enabled:
            logger.info("ONET Classifier Lambda is disabled, returning None")
            return None

        try:
            headers = {"X-Api-Key": self.api_key}

            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(
                    self.url, json={"job_description": job_description}, headers=headers
                )
                response.raise_for_status()

                # process output
                response_data = response.json()

                if not response_data.get("onet_code"):
                    raise Exception("ONET code not found in response")

                return response_data.get("onet_code", {})

        except httpx.TimeoutException:
            raise Exception("Request to ONET Classifier Lambda timed out")
        except httpx.HTTPStatusError as e:
            raise Exception(
                f"ONET Classifier Lambda API error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise Exception(
                f"Error communicating with ONET Classifier Lambda: {str(e)}"
            )


# Global singleton instance
onet_classifier_service = OnetClassifierService(
    url=ONET_CLASSIFIER_LAMBDA_URL, api_key=ONET_CLASSIFIER_LAMBDA_API_KEY
)

FROM python:3.12-slim

WORKDIR /backend

# Install uv and dependencies
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy application code
COPY . /backend
RUN chmod +x /backend/start.sh

EXPOSE 8000

CMD ["/backend/start.sh"]

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from model_utils import load_model, predict_severity

# Initialize FastAPI App
app = FastAPI(
    title="Bucaramanga Accident Severity API",
    description="API for predicting the severity of reported traffic accidents in Bucaramanga.",
    version="1.0.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the model at startup
ml_model = None

@app.on_event("startup")
def startup_event():
    global ml_model
    ml_model = load_model()

# Define Request Structure
class IncidentData(BaseModel):
    time_of_day: str
    neighborhood: str
    vehicle_type: str
    reporting_entity: str

# API endpoint for predictions
@app.post("/api/predict")
async def predict_incident_severity(data: IncidentData):
    try:
        # Pass the parsed Pydantic data back as a dict to model_utils
        prediction_result = predict_severity(ml_model, data.model_dump())
        return prediction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Configure static file serving for the frontend
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

@app.get("/")
def read_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))

app.mount("/", StaticFiles(directory=frontend_path, html=False), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

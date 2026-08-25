# Intelligent Diabetes Risk Predictor

Final year project: predicts diabetes risk using machine learning (Neural Network, SVM, Decision Tree, Logistic Regression), with a FastAPI backend and Next.js frontend.

Status: In Progress

## Regenerating the trained model
The trained model files (`ml/models/`) are not included in this repo. 
To regenerate them, run `ml/notebooks/02_model_training.ipynb` from top to bottom.

## Running the backend
cd backend
conda activate diabetes-backend
pip install -r requirements.txt
uvicorn main:app --reload
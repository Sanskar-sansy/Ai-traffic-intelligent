from sklearn.linear_model import LinearRegression
import numpy as np

model = LinearRegression()

# Simple training (replace later)
X = np.array([[5], [10], [20], [30], [40]])
y = np.array([10, 18, 35, 50, 65])

model.fit(X, y)

def predict_traffic(count):
    return int(model.predict([[count]])[0])
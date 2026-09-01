# test_upload.py
import requests

# 1. Apka API Gateway URL yahan paste karen
API_URL = "https://vbkod6j4wc.execute-api.us-east-1.amazonaws.com/upload"

# 2. API se fresh upload URL mangein
print("Fetching presigned URL...")
response = requests.post(API_URL, json={"filename": "test-fresh-temp5.txt"})
data = response.json()
upload_url = data["uploadUrl"]

# 3. Direct S3 par content upload karen
print("Uploading text to S3...")
file_content = "This Business Agreement is between Company A and Company B. Laws of Canada apply."
s3_response = requests.put(
    upload_url, 
    data=file_content, 
    headers={"Content-Type": "text/plain"}
)

print(f"S3 Response Status Code: {s3_response.status_code}")
if s3_response.status_code == 200:
    print("🚀 SUCCESS! File uploaded perfectly without signature errors.")
else:
    print("Failed:", s3_response.text)
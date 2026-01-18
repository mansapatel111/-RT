import os
import requests
import json
from dotenv import load_dotenv

load_dotenv() 

# MongoDB Data API configuration
MONGODB_DATA_API_URL = "https://data.mongodb-api.com/app/data-finder/endpoint/data/v1"
API_KEY = os.getenv('MONGODB_API_KEY')  # You'll need to create this
CLUSTER_NAME = "gallery"
DATABASE_NAME = "sight_data"
COLLECTION_NAME = "artifacts"

def test_api_connection():
    """Test connection using MongoDB Data API (HTTP-based)"""
    print("🔄 Testing MongoDB Data API connection...")
    
    if not API_KEY:
        print("❌ MONGODB_API_KEY not found in .env file")
        print("🔧 To create an API key:")
        print("   1. Go to MongoDB Atlas > App Services")
        print("   2. Create a new app or use existing")
        print("   3. Go to Authentication > API Keys")
        print("   4. Create new API key and add to .env file")
        return False
    
    headers = {
        "Content-Type": "application/json",
        "api-key": API_KEY
    }
    
    # Test with findOne operation
    payload = {
        "collection": COLLECTION_NAME,
        "database": DATABASE_NAME,
        "dataSource": CLUSTER_NAME,
        "filter": {"mode": "museum", "name": "The Soup"}
    }
    
    try:
        response = requests.post(
            f"{MONGODB_DATA_API_URL}/action/findOne",
            headers=headers,
            data=json.dumps(payload),
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ MongoDB Data API connection successful!")
            print("📄 Document found:", result.get('document'))
            return True
        else:
            print(f"❌ API request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_api_connection()
    
    if not success:
        print("\n🔧 Alternative setup instructions:")
        print("1. Create MongoDB App Services app")
        print("2. Enable Data API")
        print("3. Create API key")
        print("4. Add MONGODB_API_KEY to .env file")
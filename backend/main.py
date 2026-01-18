import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

load_dotenv() 
mongodb_password = os.getenv('MONGODB_PASSWORD')

# Try different connection string formats
uri_options = [
    f"mongodb+srv://elinakocarslan_db_user:{mongodb_password}@gallery.adiobn2.mongodb.net/sight_data?retryWrites=true&w=majority",
    f"mongodb+srv://elinakocarslan_db_user:{mongodb_password}@gallery.adiobn2.mongodb.net/?appName=gallery&retryWrites=true&w=majority&ssl=true",
    f"mongodb+srv://elinakocarslan_db_user:{mongodb_password}@gallery.adiobn2.mongodb.net/?retryWrites=true&w=majority&authSource=admin"
]

def try_connection(uri, description):
    print(f"\n🔄 Trying {description}...")
    try:
        client = MongoClient(
            uri, 
            server_api=ServerApi('1'),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000,
            retryWrites=True
        )
        client.admin.command('ping')
        print(f"✅ {description} - SUCCESS!")
        return client
    except Exception as e:
        print(f"❌ {description} - FAILED: {str(e)[:100]}...")
        return None

# Try each connection method
successful_client = None
for i, uri in enumerate(uri_options):
    successful_client = try_connection(uri, f"Connection method {i+1}")
    if successful_client:
        break
# Test the connection with better error handling
if successful_client:
    try:
        print("\n📋 Testing database operations...")
        
        # List databases
        dbs = successful_client.list_database_names()
        print("📋 Databases found:", dbs)
        
        # Access the database and collection properly
        db = successful_client["sight_data"]
        collection = db["artifacts"]
        
        # Test document retrieval
        doc = collection.find_one({"mode": "museum", "name": "The Soup"})
        print("📄 Document found:", doc)
        
    except Exception as e:
        print("❌ Database operation failed:")
        print(f"   Error: {e}")
    finally:
        successful_client.close()
else:
    print("\n❌ All connection methods failed!")
    print("\n🔧 Network-level troubleshooting needed:")
    print("   1. Your network/firewall may be blocking MongoDB Atlas")
    print("   2. Try connecting from a different network (mobile hotspot)")
    print("   3. Contact your IT department about MongoDB Atlas access")
    print("   4. Consider using MongoDB Atlas Data API as an alternative")

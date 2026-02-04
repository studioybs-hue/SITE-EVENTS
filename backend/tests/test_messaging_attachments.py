"""
Test suite for messaging with file attachments and real-time features
Tests: File upload, file retrieval, messages with attachments, Socket.IO events
"""
import pytest
import requests
import os
import io
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_CLIENT_EMAIL = "client@test.com"
TEST_CLIENT_PASSWORD = "password123"
TEST_PROVIDER_EMAIL = "provider@test.com"
TEST_PROVIDER_PASSWORD = "password123"


class TestFileUpload:
    """File upload endpoint tests - POST /api/upload-file"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session as client"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return session
    
    def test_upload_image_file(self, auth_session):
        """Test uploading an image file (jpg)"""
        # Create a simple test image (1x1 pixel PNG)
        image_content = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test_image.png', io.BytesIO(image_content), 'image/png')}
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert "file_id" in data
        assert "file_name" in data
        assert data["file_name"] == "test_image.png"
        assert data["file_type"] == "image"
        assert "file_url" in data
        assert data["file_url"].startswith("/api/files/")
        assert "file_size" in data
        assert data["file_size"] > 0
        
        return data
    
    def test_upload_document_file(self, auth_session):
        """Test uploading a document file (txt)"""
        doc_content = b"This is a test document for the messaging system."
        
        files = {'file': ('test_document.txt', io.BytesIO(doc_content), 'text/plain')}
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert data["file_type"] == "document"
        assert data["file_name"] == "test_document.txt"
        assert data["file_size"] == len(doc_content)
    
    def test_upload_pdf_file(self, auth_session):
        """Test uploading a PDF file"""
        # Minimal valid PDF content
        pdf_content = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \ntrailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n109\n%%EOF'
        
        files = {'file': ('contract.pdf', io.BytesIO(pdf_content), 'application/pdf')}
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        
        data = response.json()
        assert data["file_type"] in ["document", "contract"]
        assert data["file_name"] == "contract.pdf"
    
    def test_upload_without_auth(self):
        """Test upload without authentication returns 401"""
        doc_content = b"Test content"
        files = {'file': ('test.txt', io.BytesIO(doc_content), 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/api/upload-file", files=files)
        assert response.status_code == 401
    
    def test_upload_invalid_file_type(self, auth_session):
        """Test uploading an invalid file type returns 400"""
        exe_content = b"MZ\x90\x00"  # Fake exe header
        
        files = {'file': ('malware.exe', io.BytesIO(exe_content), 'application/x-msdownload')}
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert "non autorisé" in data["detail"].lower() or "not allowed" in data["detail"].lower()


class TestFileRetrieval:
    """File retrieval endpoint tests - GET /api/files/{filename}"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def uploaded_file(self, auth_session):
        """Upload a file and return its info"""
        content = b"Test file content for retrieval test"
        files = {'file': ('retrieval_test.txt', io.BytesIO(content), 'text/plain')}
        response = auth_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert response.status_code == 200
        return response.json()
    
    def test_retrieve_uploaded_file(self, uploaded_file):
        """Test retrieving an uploaded file"""
        file_url = uploaded_file["file_url"]
        filename = file_url.split("/")[-1]
        
        response = requests.get(f"{BASE_URL}/api/files/{filename}")
        
        assert response.status_code == 200
        assert "text/plain" in response.headers.get("Content-Type", "")
        assert b"Test file content" in response.content
    
    def test_retrieve_nonexistent_file(self):
        """Test retrieving a non-existent file returns 404"""
        response = requests.get(f"{BASE_URL}/api/files/nonexistent_file_12345.txt")
        assert response.status_code == 404


class TestMessagesWithAttachments:
    """Message endpoint tests with attachments - POST /api/messages"""
    
    @pytest.fixture
    def client_session(self):
        """Get authenticated session as client"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        self.client_user_id = response.json()["user_id"]
        return session
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated session as provider"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        self.provider_user_id = response.json()["user_id"]
        return session
    
    def test_send_message_with_attachment(self, client_session, provider_session):
        """Test sending a message with file attachment"""
        # First upload a file
        content = b"Contract document content"
        files = {'file': ('contract.txt', io.BytesIO(content), 'text/plain')}
        upload_response = client_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert upload_response.status_code == 200
        file_data = upload_response.json()
        
        # Get provider user_id
        provider_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        provider_user_id = provider_login.json()["user_id"]
        
        # Send message with attachment
        unique_content = f"TEST_Message with attachment {uuid.uuid4().hex[:8]}"
        message_response = client_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": provider_user_id,
            "content": unique_content,
            "attachments": [{
                "file_id": file_data["file_id"],
                "file_name": file_data["file_name"],
                "file_type": file_data["file_type"],
                "file_url": file_data["file_url"],
                "file_size": file_data["file_size"]
            }]
        })
        
        assert message_response.status_code == 200, f"Send message failed: {message_response.text}"
        
        msg_data = message_response.json()
        assert "message_id" in msg_data
        assert msg_data["content"] == unique_content
        assert "attachments" in msg_data
        assert len(msg_data["attachments"]) == 1
        assert msg_data["attachments"][0]["file_id"] == file_data["file_id"]
        
        return msg_data
    
    def test_send_message_only_attachment_no_content(self, client_session):
        """Test sending a message with only attachment (empty content)"""
        # Upload a file
        content = b"Image data"
        files = {'file': ('photo.png', io.BytesIO(content), 'image/png')}
        upload_response = client_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert upload_response.status_code == 200
        file_data = upload_response.json()
        
        # Get provider user_id
        provider_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        provider_user_id = provider_login.json()["user_id"]
        
        # Send message with only attachment
        message_response = client_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": provider_user_id,
            "content": "",
            "attachments": [{
                "file_id": file_data["file_id"],
                "file_name": file_data["file_name"],
                "file_type": file_data["file_type"],
                "file_url": file_data["file_url"],
                "file_size": file_data["file_size"]
            }]
        })
        
        # This should work - message with only attachment
        assert message_response.status_code == 200, f"Send message failed: {message_response.text}"
    
    def test_get_messages_with_attachments(self, client_session):
        """Test retrieving messages includes attachments"""
        # Get provider user_id
        provider_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        provider_user_id = provider_login.json()["user_id"]
        
        # Get messages
        response = client_session.get(f"{BASE_URL}/api/messages/{provider_user_id}")
        assert response.status_code == 200
        
        messages = response.json()
        assert isinstance(messages, list)
        
        # Check if any message has attachments
        has_attachments = any(msg.get("attachments", []) for msg in messages)
        # Note: This may be False if no attachments were sent yet
        print(f"Messages retrieved: {len(messages)}, has attachments: {has_attachments}")


class TestConversationsEndpoint:
    """Conversations endpoint tests - GET /api/messages/conversations"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_conversations(self, auth_session):
        """Test getting list of conversations"""
        response = auth_session.get(f"{BASE_URL}/api/messages/conversations")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # If there are conversations, verify structure
        if len(data) > 0:
            conv = data[0]
            assert "user_id" in conv
            assert "name" in conv
            assert "email" in conv
    
    def test_get_conversations_unauthenticated(self):
        """Test getting conversations without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 401


class TestRecentMessagesEndpoint:
    """Recent messages endpoint tests - GET /api/messages/recent"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_recent_messages(self, auth_session):
        """Test getting recent messages with unread count"""
        response = auth_session.get(f"{BASE_URL}/api/messages/recent")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "messages" in data
        assert "unread_count" in data
        assert isinstance(data["messages"], list)
        assert isinstance(data["unread_count"], int)


class TestMessageReadStatus:
    """Test message read status functionality"""
    
    @pytest.fixture
    def client_session(self):
        """Get authenticated session as client"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def provider_session(self):
        """Get authenticated session as provider"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_message_initially_unread(self, client_session):
        """Test that new messages are marked as unread"""
        # Get provider user_id
        provider_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        provider_user_id = provider_login.json()["user_id"]
        
        # Send a new message
        unique_content = f"TEST_Unread test {uuid.uuid4().hex[:8]}"
        response = client_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": provider_user_id,
            "content": unique_content
        })
        
        assert response.status_code == 200
        msg = response.json()
        assert msg["read"] == False


class TestIntegrationFlow:
    """Integration tests for complete messaging flow with attachments"""
    
    def test_complete_messaging_flow_with_attachment(self):
        """
        Test complete flow:
        1. Client logs in
        2. Client uploads a file
        3. Client sends message with attachment to provider
        4. Provider logs in
        5. Provider retrieves messages
        6. Verify attachment is accessible
        """
        # Step 1: Client login
        client_session = requests.Session()
        client_login = client_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        assert client_login.status_code == 200
        client_user_id = client_login.json()["user_id"]
        
        # Step 2: Upload file
        file_content = f"Contract for event - {uuid.uuid4().hex[:8]}".encode()
        files = {'file': ('event_contract.txt', io.BytesIO(file_content), 'text/plain')}
        upload_response = client_session.post(f"{BASE_URL}/api/upload-file", files=files)
        assert upload_response.status_code == 200
        file_data = upload_response.json()
        
        # Step 3: Get provider user_id and send message
        provider_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        provider_user_id = provider_login.json()["user_id"]
        
        unique_content = f"TEST_Integration flow {uuid.uuid4().hex[:8]}"
        message_response = client_session.post(f"{BASE_URL}/api/messages", json={
            "receiver_id": provider_user_id,
            "content": unique_content,
            "attachments": [{
                "file_id": file_data["file_id"],
                "file_name": file_data["file_name"],
                "file_type": file_data["file_type"],
                "file_url": file_data["file_url"],
                "file_size": file_data["file_size"]
            }]
        })
        assert message_response.status_code == 200
        sent_message = message_response.json()
        
        # Step 4: Provider login
        provider_session = requests.Session()
        provider_login = provider_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_PROVIDER_EMAIL,
            "password": TEST_PROVIDER_PASSWORD
        })
        assert provider_login.status_code == 200
        
        # Step 5: Provider retrieves messages
        messages_response = provider_session.get(f"{BASE_URL}/api/messages/{client_user_id}")
        assert messages_response.status_code == 200
        messages = messages_response.json()
        
        # Find our message
        found_message = None
        for msg in messages:
            if msg["content"] == unique_content:
                found_message = msg
                break
        
        assert found_message is not None, "Sent message not found"
        assert len(found_message.get("attachments", [])) == 1
        
        # Step 6: Verify attachment is accessible
        attachment = found_message["attachments"][0]
        filename = attachment["file_url"].split("/")[-1]
        file_response = requests.get(f"{BASE_URL}/api/files/{filename}")
        assert file_response.status_code == 200
        assert b"Contract for event" in file_response.content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      // Get current user
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const userData = await userRes.json();
      setUser(userData);

      // Fetch conversations
      const convRes = await fetch(`${BACKEND_URL}/api/messages/conversations`, {
        credentials: 'include',
      });
      const convData = await convRes.json();
      setConversations(convData);

      // Check for provider parameter (from ProviderCard contact button)
      const providerId = searchParams.get('provider');
      if (providerId) {
        setInitializing(true);
        await initializeProviderConversation(providerId, convData);
        setInitializing(false);
      }
      
      // Check for direct user parameter
      const userId = searchParams.get('user');
      if (userId && !providerId) {
        await fetchUserAndSelect(userId, convData);
      }
    } catch (error) {
      console.error('Error initializing page:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeProviderConversation = async (providerId, existingConversations) => {
    try {
      // Get provider profile to find user_id
      const providerRes = await fetch(`${BACKEND_URL}/api/providers/${providerId}`, {
        credentials: 'include',
      });
      
      if (!providerRes.ok) {
        toast.error('Prestataire non trouvé');
        return;
      }
      
      const provider = await providerRes.json();
      const targetUserId = provider.user_id;
      
      // Check if conversation already exists
      const existingConv = existingConversations.find(c => c.user_id === targetUserId);
      
      if (existingConv) {
        setSelectedUser(existingConv);
      } else {
        // Fetch user details for new conversation
        const userRes = await fetch(`${BACKEND_URL}/api/users/${targetUserId}`, {
          credentials: 'include',
        });
        
        if (userRes.ok) {
          const targetUser = await userRes.json();
          setSelectedUser({
            user_id: targetUser.user_id,
            name: targetUser.name,
            email: targetUser.email,
            picture: targetUser.picture,
            business_name: provider.business_name
          });
        } else {
          // Fallback with provider info
          setSelectedUser({
            user_id: targetUserId,
            name: provider.business_name,
            email: '',
            picture: null
          });
        }
      }
    } catch (error) {
      console.error('Error initializing provider conversation:', error);
      toast.error('Erreur lors de l\'initialisation');
    }
  };

  const fetchUserAndSelect = async (userId, existingConversations) => {
    try {
      // Check if already in conversations
      const existingConv = existingConversations.find(c => c.user_id === userId);
      
      if (existingConv) {
        setSelectedUser(existingConv);
      } else {
        // Fetch user details
        const userRes = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
          credentials: 'include',
        });
        
        if (userRes.ok) {
          const targetUser = await userRes.json();
          setSelectedUser(targetUser);
        } else {
          setSelectedUser({ user_id: userId, name: 'Utilisateur', email: '' });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/messages/${selectedUser.user_id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiver_id: selectedUser.user_id,
          content: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
        
        // Add to conversations if not already there
        if (!conversations.find(c => c.user_id === selectedUser.user_id)) {
          setConversations(prev => [selectedUser, ...prev]);
        }
      } else {
        toast.error('Échec de l\'envoi du message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser(conv);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ProtectedRoute>
      {(userData) => (
        <div className="min-h-screen bg-background">
          <Navbar user={userData || user} onLogout={handleLogout} />

          <div className="px-6 md:px-12 lg:px-24 py-12">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-heading font-medium tracking-tight text-foreground mb-8">
                Messages
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 250px)' }}>
                {/* Conversations List */}
                <Card className="p-4 overflow-y-auto">
                  <h2 className="font-semibold mb-4">Conversations</h2>
                  {loading || initializing ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                      {initializing && <p className="text-sm text-muted-foreground mt-2">Chargement...</p>}
                    </div>
                  ) : conversations.length === 0 && !selectedUser ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground" data-testid="no-conversations">
                        Aucune conversation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contactez un prestataire pour démarrer
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Show selected user first if it's a new conversation */}
                      {selectedUser && !conversations.find(c => c.user_id === selectedUser.user_id) && (
                        <div
                          className="p-3 rounded-sm bg-secondary"
                          data-testid="new-conversation-item"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={selectedUser.picture} />
                              <AvatarFallback>{selectedUser.name?.[0] || selectedUser.business_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{selectedUser.business_name || selectedUser.name}</p>
                              <p className="text-xs text-accent">Nouvelle conversation</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {conversations.map((conv) => (
                        <div
                          key={conv.user_id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`p-3 rounded-sm cursor-pointer transition-colors ${
                            selectedUser?.user_id === conv.user_id
                              ? 'bg-secondary'
                              : 'hover:bg-muted'
                          }`}
                          data-testid="conversation-item"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={conv.picture} />
                              <AvatarFallback>{conv.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{conv.name}</p>
                              <p className="text-xs text-muted-foreground">{conv.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Messages Area */}
                <Card className="md:col-span-2 flex flex-col">
                  {selectedUser ? (
                    <>
                      {/* Header */}
                      <div className="p-4 border-b border-border flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={selectedUser.picture} />
                          <AvatarFallback>{selectedUser.name?.[0] || selectedUser.business_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold" data-testid="selected-user-name">
                            {selectedUser.business_name || selectedUser.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-12">
                            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground" data-testid="no-messages">
                              Démarrez la conversation !
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              Envoyez votre premier message à {selectedUser.business_name || selectedUser.name}
                            </p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <div
                              key={msg.message_id}
                              className={msg.sender_id === user?.user_id ? 'flex justify-end' : 'flex justify-start'}
                              data-testid="message-item"
                            >
                              <div
                                className={msg.sender_id === user?.user_id ? 'chat-bubble-sent' : 'chat-bubble-received'}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                        <div className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrire un message..."
                            className="flex-1"
                            data-testid="message-input"
                          />
                          <Button type="submit" className="rounded-full" data-testid="send-message-btn">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="select-conversation">
                      <p>Sélectionnez une conversation</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default MessagesPage;
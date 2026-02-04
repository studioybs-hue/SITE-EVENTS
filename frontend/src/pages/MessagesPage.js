import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, Paperclip, X, FileText, Image as ImageIcon, Download } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = BACKEND_URL.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://');
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join_room', { user_id: user.user_id });
    });

    socketRef.current.on('new_message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });
      // Update conversations if needed
      refreshConversations();
    });

    socketRef.current.on('message_sent', (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });
    });

    socketRef.current.on('user_typing', ({ user_id, is_typing }) => {
      if (selectedUser && user_id === selectedUser.user_id) {
        setOtherUserTyping(is_typing);
      }
    });

    socketRef.current.on('messages_read', ({ reader_id }) => {
      if (selectedUser && reader_id === selectedUser.user_id) {
        setMessages(prev => prev.map(m => 
          m.sender_id === user.user_id ? { ...m, read: true } : m
        ));
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', { user_id: user.user_id });
        socketRef.current.disconnect();
      }
    };
  }, [user, BACKEND_URL]);

  const refreshConversations = async () => {
    try {
      const convRes = await fetch(`${BACKEND_URL}/api/messages/conversations`, {
        credentials: 'include',
      });
      const convData = await convRes.json();
      setConversations(convData);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      const userRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const userData = await userRes.json();
      setUser(userData);

      const convRes = await fetch(`${BACKEND_URL}/api/messages/conversations`, {
        credentials: 'include',
      });
      const convData = await convRes.json();
      setConversations(convData);

      const providerId = searchParams.get('provider');
      if (providerId) {
        setInitializing(true);
        await initializeProviderConversation(providerId, convData);
        setInitializing(false);
      }
      
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
      const providerRes = await fetch(`${BACKEND_URL}/api/providers/${providerId}`, {
        credentials: 'include',
      });
      
      if (!providerRes.ok) {
        toast.error('Prestataire non trouvé');
        return;
      }
      
      const provider = await providerRes.json();
      const targetUserId = provider.user_id;
      
      const existingConv = existingConversations.find(c => c.user_id === targetUserId);
      
      if (existingConv) {
        setSelectedUser(existingConv);
      } else {
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
      const existingConv = existingConversations.find(c => c.user_id === userId);
      
      if (existingConv) {
        setSelectedUser(existingConv);
      } else {
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

  // Fetch messages when selecting a user
  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      // Mark messages as read
      if (socketRef.current && user) {
        socketRef.current.emit('mark_read', {
          reader_id: user.user_id,
          sender_id: selectedUser.user_id
        });
      }
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

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !selectedUser || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        sender_id: user.user_id,
        receiver_id: selectedUser.user_id,
        is_typing: true
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current.emit('typing', {
        sender_id: user.user_id,
        receiver_id: selectedUser.user_id,
        is_typing: false
      });
    }, 2000);
  }, [isTyping, selectedUser, user]);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 10MB)`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${BACKEND_URL}/api/upload-file`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (response.ok) {
          const fileData = await response.json();
          uploadedFiles.push(fileData);
        } else {
          const error = await response.json();
          toast.error(error.detail || `Échec de l'upload de ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }

    if (uploadedFiles.length > 0) {
      setPendingAttachments(prev => [...prev, ...uploadedFiles]);
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedUser) return;

    const messageContent = newMessage.trim();
    const attachments = pendingAttachments.map(att => ({
      file_id: att.file_id,
      file_name: att.file_name,
      file_type: att.file_type,
      file_url: att.file_url,
      file_size: att.file_size
    }));

    // Clear input immediately for better UX
    setNewMessage('');
    setPendingAttachments([]);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (socketRef.current && isTyping) {
      socketRef.current.emit('typing', {
        sender_id: user.user_id,
        receiver_id: selectedUser.user_id,
        is_typing: false
      });
      setIsTyping(false);
    }

    // Send via Socket.IO if connected
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', {
        sender_id: user.user_id,
        receiver_id: selectedUser.user_id,
        content: messageContent,
        attachments: attachments
      });
    } else {
      // Fallback to HTTP API
      try {
        const response = await fetch(`${BACKEND_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            receiver_id: selectedUser.user_id,
            content: messageContent,
            attachments: attachments
          }),
        });

        if (response.ok) {
          fetchMessages();
        } else {
          toast.error('Échec de l\'envoi du message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Erreur lors de l\'envoi');
      }
    }

    // Update conversations list
    if (!conversations.find(c => c.user_id === selectedUser.user_id)) {
      setConversations(prev => [selectedUser, ...prev]);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedUser(conv);
    setOtherUserTyping(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const renderAttachment = (attachment) => {
    const isImage = attachment.file_type === 'image';
    const fileUrl = `${BACKEND_URL}${attachment.file_url}`;

    if (isImage) {
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={fileUrl} 
            alt={attachment.file_name}
            className="max-w-[200px] max-h-[200px] rounded-md object-cover"
          />
        </a>
      );
    }

    return (
      <a 
        href={fileUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-background/50 rounded-md hover:bg-background/80 transition-colors"
      >
        <FileText className="h-4 w-4" />
        <span className="text-sm truncate max-w-[150px]">{attachment.file_name}</span>
        <Download className="h-4 w-4 ml-auto" />
      </a>
    );
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
                          <p className="text-xs text-muted-foreground">
                            {otherUserTyping ? (
                              <span className="text-accent animate-pulse">Est en train d'écrire...</span>
                            ) : (
                              selectedUser.email
                            )}
                          </p>
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
                                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                
                                {/* Attachments */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="space-y-1">
                                    {msg.attachments.map((att, idx) => (
                                      <div key={idx}>
                                        {renderAttachment(att)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-end gap-2 mt-1">
                                  <p className="text-xs opacity-70">
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {msg.sender_id === user?.user_id && (
                                    <span className="text-xs opacity-70">
                                      {msg.read ? '✓✓' : '✓'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Pending Attachments Preview */}
                      {pendingAttachments.length > 0 && (
                        <div className="px-4 py-2 border-t border-border bg-muted/30">
                          <div className="flex flex-wrap gap-2">
                            {pendingAttachments.map((att, idx) => (
                              <div key={idx} className="relative group">
                                {att.file_type === 'image' ? (
                                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                                    <img 
                                      src={`${BACKEND_URL}${att.file_url}`} 
                                      alt={att.file_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <button
                                  onClick={() => removeAttachment(idx)}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <p className="text-xs truncate max-w-[64px] mt-1 text-center">{att.file_name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            multiple
                            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            data-testid="attach-file-btn"
                          >
                            {uploading ? (
                              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Paperclip className="h-4 w-4" />
                            )}
                          </Button>
                          <Input
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              handleTyping();
                            }}
                            placeholder="Écrire un message..."
                            className="flex-1"
                            data-testid="message-input"
                          />
                          <Button 
                            type="submit" 
                            className="rounded-full" 
                            data-testid="send-message-btn"
                            disabled={!newMessage.trim() && pendingAttachments.length === 0}
                          >
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

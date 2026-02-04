import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ChevronRight } from 'lucide-react';

const RecentMessages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchRecentMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchRecentMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentMessages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/messages/recent`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching recent messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleMessageClick = (senderId) => {
    navigate(`/messages?user=${senderId}`);
  };

  const handleViewAll = () => {
    navigate('/messages');
  };

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Derniers messages
          {unreadCount > 0 && (
            <Badge 
              className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full"
              data-testid="unread-badge"
            >
              {unreadCount}
            </Badge>
          )}
        </h3>
        <button 
          onClick={handleViewAll}
          className="text-sm text-accent hover:text-accent/80 flex items-center gap-1"
          data-testid="view-all-messages-btn"
        >
          Voir tout
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-6">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground" data-testid="no-recent-messages">
            Aucun message
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <button
              key={msg.message_id}
              onClick={() => handleMessageClick(msg.sender.user_id)}
              className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-secondary/50 ${
                !msg.read ? 'bg-accent/5 border-l-2 border-accent' : ''
              }`}
              data-testid="recent-message-item"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={msg.sender.picture} />
                  <AvatarFallback className="text-xs">
                    {(msg.sender.business_name || msg.sender.name)?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${!msg.read ? 'font-semibold' : 'font-medium'}`}>
                      {msg.sender.business_name || msg.sender.name}
                    </p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${!msg.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {msg.content}
                  </p>
                </div>
                {!msg.read && (
                  <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RecentMessages;

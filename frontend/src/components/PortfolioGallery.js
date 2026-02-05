import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Play, Pause, ChevronLeft, ChevronRight, X, Eye, Image, Video, Youtube, Volume2, VolumeX } from 'lucide-react';

const EVENT_TYPES = {
  wedding: 'Mariage',
  birthday: 'Anniversaire',
  corporate: 'Entreprise',
  baptism: 'Baptême',
  party: 'Soirée',
  other: 'Autre'
};

const PortfolioGallery = ({ providerId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    fetchPortfolio();
  }, [providerId]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/provider/${providerId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStory = (index) => {
    setActiveIndex(index);
    setIsPlaying(true);
    // Track view
    trackView(items[index].item_id);
  };

  const closeStory = () => {
    setActiveIndex(null);
    setIsPlaying(false);
    clearTimeout(autoPlayTimerRef.current);
  };

  const nextStory = () => {
    if (activeIndex < items.length - 1) {
      setActiveIndex(activeIndex + 1);
      trackView(items[activeIndex + 1].item_id);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      trackView(items[activeIndex - 1].item_id);
    }
  };

  const trackView = async (itemId) => {
    try {
      await fetch(`${BACKEND_URL}/api/portfolio/${itemId}/view`, {
        method: 'POST'
      });
    } catch (error) {
      // Ignore errors
    }
  };

  const extractVideoId = (url) => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
    
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };
    
    return null;
  };

  // Auto-advance for photos
  useEffect(() => {
    if (activeIndex !== null && items[activeIndex]) {
      const currentItem = items[activeIndex];
      
      // Auto-advance photos after 5 seconds
      if (currentItem.media_type === 'photo' && isPlaying) {
        autoPlayTimerRef.current = setTimeout(() => {
          nextStory();
        }, 5000);
      }
      
      return () => clearTimeout(autoPlayTimerRef.current);
    }
  }, [activeIndex, isPlaying, items]);

  const renderStoryContent = (item) => {
    const url = item.media_url;
    
    if (item.media_type === 'photo') {
      return (
        <img 
          src={url.startsWith('/') ? `${BACKEND_URL}${url}` : url}
          alt={item.title || ''}
          className="max-h-[80vh] max-w-full object-contain"
        />
      );
    }
    
    if (item.media_type === 'video') {
      return (
        <video 
          ref={videoRef}
          src={url.startsWith('/') ? `${BACKEND_URL}${url}` : url}
          className="max-h-[80vh] max-w-full"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onEnded={nextStory}
        />
      );
    }
    
    if (item.media_type === 'youtube') {
      const videoInfo = extractVideoId(url);
      if (videoInfo) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&mute=${isMuted ? 1 : 0}`}
            className="w-full aspect-video max-h-[80vh]"
            style={{ maxWidth: '800px' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }
    
    if (item.media_type === 'vimeo') {
      const videoInfo = extractVideoId(url);
      if (videoInfo) {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1&muted=${isMuted ? 1 : 0}`}
            className="w-full aspect-video max-h-[80vh]"
            style={{ maxWidth: '800px' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }
    
    return null;
  };

  const getThumbnail = (item) => {
    if (item.media_type === 'photo') {
      const url = item.media_url;
      return url.startsWith('/') ? `${BACKEND_URL}${url}` : url;
    }
    
    if (item.media_type === 'video') {
      return item.thumbnail_url ? (item.thumbnail_url.startsWith('/') ? `${BACKEND_URL}${item.thumbnail_url}` : item.thumbnail_url) : null;
    }
    
    if (item.media_type === 'youtube') {
      const videoInfo = extractVideoId(item.media_url);
      return videoInfo ? `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg` : null;
    }
    
    return item.thumbnail_url;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'photo': return <Image className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'youtube': return <Youtube className="h-3 w-3" />;
      case 'vimeo': return <Video className="h-3 w-3" />;
      default: return <Image className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-20 h-32 bg-muted rounded-lg animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Story-style thumbnails */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Play className="h-5 w-5" />
          Portfolio
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item, index) => {
            const thumbnail = getThumbnail(item);
            return (
              <button
                key={item.item_id}
                onClick={() => openStory(index)}
                className="relative w-20 h-32 sm:w-24 sm:h-40 rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-accent/40 shrink-0 group shadow-md hover:shadow-lg transition-all hover:scale-105"
                data-testid={`story-thumb-${item.item_id}`}
              >
                {thumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={item.title || ''} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getTypeIcon(item.media_type)}
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Play indicator for videos */}
                {item.media_type !== 'photo' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-2">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                )}
                
                {/* Type badge */}
                <div className="absolute top-1.5 right-1.5">
                  <Badge className="bg-white/90 text-foreground text-[10px] px-1.5 py-0.5">
                    {getTypeIcon(item.media_type)}
                  </Badge>
                </div>
                
                {/* Title */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-screen Story Viewer */}
      {activeIndex !== null && items[activeIndex] && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeStory}
        >
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {items.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white transition-all ${
                    index < activeIndex ? 'w-full' : 
                    index === activeIndex ? 'w-full animate-progress' : 'w-0'
                  }`}
                  style={index === activeIndex && items[activeIndex].media_type === 'photo' ? {
                    animation: 'progress 5s linear forwards'
                  } : {}}
                />
              </div>
            ))}
          </div>

          {/* Close button */}
          <button 
            onClick={closeStory}
            className="absolute top-10 right-4 p-2 text-white hover:bg-white/20 rounded-full z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Mute button for videos */}
          {items[activeIndex].media_type !== 'photo' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute top-10 right-16 p-2 text-white hover:bg-white/20 rounded-full z-10"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
          )}

          {/* Navigation - Previous */}
          {activeIndex > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                prevStory();
              }}
              className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-4 text-white/50 hover:text-white z-10"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          {/* Navigation - Next */}
          {activeIndex < items.length - 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                nextStory();
              }}
              className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-4 text-white/50 hover:text-white z-10"
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}

          {/* Content */}
          <div onClick={(e) => e.stopPropagation()} className="relative">
            {renderStoryContent(items[activeIndex])}
          </div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="max-w-lg mx-auto text-white">
              {items[activeIndex].title && (
                <h4 className="text-lg font-semibold mb-1">{items[activeIndex].title}</h4>
              )}
              {items[activeIndex].description && (
                <p className="text-sm text-white/80 mb-2">{items[activeIndex].description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-white/60">
                {items[activeIndex].event_type && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {EVENT_TYPES[items[activeIndex].event_type] || items[activeIndex].event_type}
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {items[activeIndex].views_count} vues
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default PortfolioGallery;

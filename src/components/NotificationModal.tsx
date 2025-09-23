
import { Bell, CheckCircle, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const NotificationModal = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_status_changed':
        return DollarSign;
      case 'invoice_created':
        return FileText;
      case 'invoice_status_changed':
        return CheckCircle;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_status_changed':
        return 'text-success';
      case 'invoice_created':
        return 'text-primary';
      case 'invoice_status_changed':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 hover:bg-slate-100 rounded-md transition-all duration-200 relative">
          <Bell size={16} className="text-slate-600" />
          {unreadCount > 0 && (
            <div className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center shadow-md">
              <span className="text-xs text-primary-foreground font-bold">{unreadCount}</span>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="p-0 flex items-center gap-2">
              <Bell size={18} />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-auto p-1"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-96">
          <div className="p-2">
            {notifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors mb-2 ${
                    !notification.is_read 
                      ? 'bg-accent/50 border-accent hover:bg-accent/70' 
                      : 'bg-muted/50 border-muted hover:bg-muted/70'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${!notification.is_read ? 'bg-background' : 'bg-muted'}`}>
                      <IconComponent size={14} className={iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-words">{notification.message}</p>
                      <span className="text-xs text-muted-foreground/70 mt-2 block">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {notifications.length === 0 && (
              <div className="text-center py-8">
                <Bell size={48} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationModal;

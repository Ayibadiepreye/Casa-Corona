-- Add 'read' boolean field to notifications table
-- This field tracks whether a notification has been read (alongside readAt timestamp)

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Update existing records: mark as read if readAt is not null
UPDATE notifications 
SET read = true 
WHERE read_at IS NOT NULL AND read = false;

-- Add index for faster unread queries
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);

COMMENT ON COLUMN notifications.read IS 'Boolean flag indicating if notification has been read';

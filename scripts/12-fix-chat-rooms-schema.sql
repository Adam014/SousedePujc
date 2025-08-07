-- Fix chat_rooms table to make booking_id nullable since chat rooms can exist without bookings
-- (for direct messaging between users about items)

ALTER TABLE chat_rooms 
ALTER COLUMN booking_id DROP NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_booking_id ON chat_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_item_owner ON chat_rooms(item_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_item_borrower ON chat_rooms(item_id, borrower_id);

-- Update existing chat rooms that might have null booking_id
UPDATE chat_rooms 
SET booking_id = NULL 
WHERE booking_id IS NULL;

-- Add location coordinates to items table
ALTER TABLE items 
ADD COLUMN location_lat DECIMAL(10, 8),
ADD COLUMN location_lng DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX idx_items_location ON items(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add some sample coordinates for existing items (Prague area)
-- This is just for demonstration - in real app, users would set these
UPDATE items SET 
  location_lat = 50.0755 + (RANDOM() - 0.5) * 0.1,
  location_lng = 14.4378 + (RANDOM() - 0.5) * 0.1
WHERE location IS NOT NULL;

-- Add comment
COMMENT ON COLUMN items.location_lat IS 'Latitude coordinate for item location';
COMMENT ON COLUMN items.location_lng IS 'Longitude coordinate for item location';

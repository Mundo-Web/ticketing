<?php

// Simple test without Laravel
class TestTicketHistory {
    public $description;
    public $meta;
    public $technical = null;
    
    public function getUserNameAttribute()
    {
        if ($this->technical) {
            return $this->technical->name;
        }
        
        // If no technical, try to extract from meta data first
        if ($this->meta && isset($this->meta['actor_name'])) {
            return $this->meta['actor_name'];
        }
        
        // Try to extract from description (for appointment rescheduling)
        if (strpos($this->description, ' por ') !== false) {
            $parts = explode(' por ', $this->description);
            if (count($parts) >= 2) {
                $actorPart = $parts[1];
                // Extract name before " -" if there's a reason
                if (strpos($actorPart, ' -') !== false) {
                    $actorPart = explode(' -', $actorPart)[0];
                }
                return trim($actorPart);
            }
        }
        
        // Try to extract from description (for private notes)
        if (strpos($this->description, 'Private note by ') === 0) {
            $parts = explode('Private note by ', $this->description);
            if (count($parts) >= 2) {
                $actorPart = explode(':', $parts[1])[0];
                return trim($actorPart);
            }
        }
        
        return "System";
    }
    
    public function __get($name) {
        if ($name === 'user_name') {
            return $this->getUserNameAttribute();
        }
        return null;
    }
}

// Test case
$history = new TestTicketHistory();
$history->description = "Cita reagendada de 20/08/2025 23:20 a 20/08/2025 23:24 por ADK ASSIST";
$history->meta = ['actor_name' => 'ADK ASSIST'];

echo "Test description: " . $history->description . "\n";
echo "Extracted user_name: " . $history->user_name . "\n";

// Test without meta
$history2 = new TestTicketHistory();
$history2->description = "Cita reagendada de 20/08/2025 23:20 a 20/08/2025 23:24 por ADK ASSIST";

echo "\nTest 2 description: " . $history2->description . "\n";
echo "Extracted user_name: " . $history2->user_name . "\n";
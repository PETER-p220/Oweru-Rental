<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fix any NULL or invalid values before touching the column
        DB::statement("UPDATE users SET user_type = 'tenant' WHERE user_type IS NULL OR user_type = ''");

        // 2. Sanitize any values not in the final enum list
        DB::statement("
            UPDATE users 
            SET user_type = 'tenant' 
            WHERE user_type NOT IN ('tenant', 'landlord', 'agent', 'admin', 'commercial', 'bnb_owner')
        ");

        // 3. Temporarily widen to VARCHAR so MySQL won't complain during transition
        DB::statement("ALTER TABLE users MODIFY COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'tenant'");

        // 4. Now safely set the final enum with both 'commercial' and 'bnb_owner' included
        DB::statement("
            ALTER TABLE users 
            MODIFY COLUMN user_type 
            ENUM('tenant', 'landlord', 'agent', 'admin', 'commercial', 'bnb_owner') 
            NOT NULL DEFAULT 'tenant'
        ");
    }

    public function down(): void
    {
        // Revert any 'bnb_owner' users to 'tenant' before shrinking the enum
        DB::statement("UPDATE users SET user_type = 'tenant' WHERE user_type = 'bnb_owner'");

        DB::statement("ALTER TABLE users MODIFY COLUMN user_type VARCHAR(20) NOT NULL DEFAULT 'tenant'");

        DB::statement("
            ALTER TABLE users 
            MODIFY COLUMN user_type 
            ENUM('tenant', 'landlord', 'agent', 'admin', 'commercial') 
            NOT NULL DEFAULT 'tenant'
        ");
    }
};

#!/usr/bin/env python3
"""
Secure API Key Setup Script
Retrieves API keys from keyring and updates .env file safely
"""

import os
import keyring
import shutil
from pathlib import Path

def setup_api_keys():
    """Set up API keys in .env file from keyring"""
    
    # Get project root
    project_root = Path(__file__).parent.parent
    env_file = project_root / '.env'
    
    if not env_file.exists():
        print(f"❌ .env file not found at {env_file}")
        return False
    
    # Create backup
    backup_file = env_file.with_suffix('.env.backup')
    shutil.copy2(env_file, backup_file)
    print(f"✅ Created backup: {backup_file}")
    
    try:
        # Get API keys from keyring
        openai_key = keyring.get_password('memex', 'OPENAI_API_KEY')
        claude_key = keyring.get_password('memex', 'CLAUDE_API_KEY')  # For ANTHROPIC_API_KEY
        
        if not openai_key and not claude_key:
            print("❌ No API keys found in keyring")
            return False
            
        # Read current .env content
        with open(env_file, 'r') as f:
            lines = f.readlines()
        
        # Update lines with API keys
        updated_lines = []
        keys_updated = []
        
        for line in lines:
            if line.startswith('OPENAI_API_KEY=') and openai_key:
                updated_lines.append(f'OPENAI_API_KEY="{openai_key}"\n')
                keys_updated.append('OPENAI_API_KEY')
            elif line.startswith('ANTHROPIC_API_KEY=') and claude_key:
                updated_lines.append(f'ANTHROPIC_API_KEY="{claude_key}"\n')
                keys_updated.append('ANTHROPIC_API_KEY')
            else:
                updated_lines.append(line)
        
        # Write updated content
        with open(env_file, 'w') as f:
            f.writelines(updated_lines)
        
        print(f"✅ Updated API keys: {', '.join(keys_updated)}")
        
        # Verify keys are properly formatted
        if openai_key and not openai_key.startswith('sk-'):
            print("⚠️  Warning: OpenAI key format may be invalid")
        if claude_key and not claude_key.startswith('sk-ant-'):
            print("⚠️  Warning: Anthropic key format may be invalid")
            
        return True
        
    except Exception as e:
        print(f"❌ Error updating API keys: {e}")
        # Restore backup
        shutil.copy2(backup_file, env_file)
        print("✅ Restored backup")
        return False

if __name__ == '__main__':
    print("🔐 Setting up API keys from keyring...")
    success = setup_api_keys()
    if success:
        print("✅ API keys setup complete!")
        print("🚀 You can now restart the application to use AI services")
    else:
        print("❌ API keys setup failed!")
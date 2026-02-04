"""
Script to revert all HTML files from SVG icons back to emoji icons
"""
import re
import os

# Emoji mappings
EMOJI_MAP = {
    'icon-star': '🌟',
    'icon-globe': '🌍',
    'icon-rocket': '🚀',
    'icon-lightbulb': '💡',
    'icon-heart': '💚',
    'icon-chat': '💬',
    'icon-chart': '📊',
    'icon-shield': '🛡️',
    'icon-check': '✓',
    'icon-lock': '🔒',
    'icon-fire': '🔥',
    'icon-calendar': '📅',
    'icon-book': '📚',
    'icon-document': '📄',
    'icon-settings': '⚙️',
    'icon-logout': '🚪',
    'icon-info': 'ℹ️',
    'icon-mood-happy': '😊',
    'icon-mood-good': '🙂',
    'icon-mood-okay': '😐',
    'icon-mood-down': '😔',
    'icon-mood-struggling': '😢',
    'icon-user': '👤',
    'icon-email': '📧',
    'icon-phone': '📞',
}

def remove_icon_css(content):
    """Remove SVG icon CSS classes"""
    pattern = r'\s*\.icon\s*\{[^}]+\}\s*\.icon-lg\s*\{[^}]+\}\s*\.icon-xl\s*\{[^}]+\}\s*\.icon-2xl\s*\{[^}]+\}\s*'
    return re.sub(pattern, '\n        ', content, flags=re.DOTALL)

def remove_svg_sprite(content):
    """Remove SVG sprite library"""
    pattern = r'(?:<!--\s*SVG Icons\s*-->\s*)?<svg\s+style="display:\s*none;">.*?</svg>\s*'
    return re.sub(pattern, '', content, flags=re.DOTALL)

def replace_svg_icons(content):
    """Replace SVG icon references with emojis"""
    
    # Pattern for SVG with icon class
    patterns = [
        # Standard SVG icons with <use>
        (r'<svg[^>]*class="[^"]*icon[^"]*"[^>]*>\s*<use\s+href="#([^"]+)"\s*/>\s*</svg>', 'standard'),
        # Mood emojis specifically
        (r'<svg[^>]*class="[^"]*mood-emoji[^"]*"[^>]*>\s*<use\s+href="#([^"]+)"\s*/>\s*</svg>', 'mood'),
    ]
    
    for pattern, type in patterns:
        def replace(match):
            full_match = match.group(0)
            icon_id = match.group(1)
            emoji = EMOJI_MAP.get(icon_id, '❓')
            
            # For mood emojis, wrap in span with class
            if 'mood-emoji' in full_match:
                return f'<span class="mood-emoji">{emoji}</span>'
            # For other icons, just return emoji (may need span based on context)
            elif 'icon-xl' in full_match or 'icon-lg' in full_match or 'icon-2xl' in full_match:
                return f'<span style="font-size: inherit;">{emoji}</span>'
            else:
                return emoji
        
        content = re.sub(pattern, replace, content, flags=re.DOTALL)
    
    return content

def process_html_file(filepath):
    """Process a single HTML file"""
    print(f"Processing {os.path.basename(filepath)}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_size = len(content)
    
    # 1. Remove icon CSS classes
    content = remove_icon_css(content)
    
    # 2. Remove SVG sprite library
    content = remove_svg_sprite(content)
    
    # 3. Replace SVG icon references with emojis
    content = replace_svg_icons(content)
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    new_size = len(content)
    print(f"  ✓ Reduced file size: {original_size} → {new_size} bytes ({original_size - new_size} bytes saved)")

def main():
    """Main function to process all HTML files"""
    base_dir = os.path.dirname(__file__)
    
    html_files = [
        'index.html', 'dashboard.html', 'analytics.html', 'mood-tracker.html',
        'chat.html', 'resources.html', 'settings.html', 'signup.html',
        'login.html', 'reset-password.html', 'about.html', 'contact.html',
        'privacy.html', 'terms.html', '404.html', 'icons.html'
    ]
    
    print("=" * 60)
    print("REVERTING SVG ICONS TO EMOJIS")
    print("=" * 60)
    print()
    
    for filename in html_files:
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            try:
                process_html_file(filepath)
            except Exception as e:
                print(f"  ✗ Error processing {filename}: {e}")
        else:
            print(f"  ⚠ File not found: {filename}")
    
    print()
    print("=" * 60)
    print("REVERSION COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()

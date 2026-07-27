import os
import urllib.request
import urllib.parse
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

text = "我来自泰国"
encoded_word = urllib.parse.quote(text)
url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_word}&tl=zh-CN&client=tw-ob"

output_dir = os.path.join("public", "audio")
os.makedirs(output_dir, exist_ok=True)
filepath = os.path.join(output_dir, f"{text}.mp3")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
        out_file.write(response.read())
    print(f"Successfully saved local audio: {filepath}")
except Exception as e:
    print(f"Error: {e}")

import os
import urllib.request
import urllib.parse
import time
import sys

# Ensure UTF-8 stdout on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

vocab_list = [
    "十点十五分", "早上", "下午", "晚上", "现在几点",
    "八点", "三点半", "一月一号", "星期一", "星期天", "今天几号",
    "昨天", "明天", "五月四日", "星期六", "生日", "假日", 
    "起床", "睡觉", "吃饭", "看书", "工作", "医院", 
    "学校", "商店", "前面", "后面", "天气", "冷", "热", 
    "你好", "加油", "生日快乐"
]

output_dir = os.path.join("public", "audio")
os.makedirs(output_dir, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

print("Starting GoogleSpeech TTS Audio downloader...")

for word in vocab_list:
    encoded_word = urllib.parse.quote(word)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_word}&tl=zh-CN&client=tw-ob"
    
    filename = f"{word}.mp3"
    filepath = os.path.join(output_dir, filename)
    
    if os.path.exists(filepath):
        print(f"Already exists: {filename}")
        continue
        
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Successfully downloaded: {filename}")
        time.sleep(0.2)
    except Exception as e:
        print(f"Failed to download: {e}")

print("TTS Audio Download complete!")

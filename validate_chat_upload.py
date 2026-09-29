import os
import requests
from PIL import Image, ImageDraw, ImageFont

backend = 'http://localhost:8000'
img_path = r'C:\temp\fitmatrix_clear_food.png'
os.makedirs(r'C:\temp', exist_ok=True)
img = Image.new('RGB', (1400, 1000), 'white')
d = ImageDraw.Draw(img)
d.rectangle((80, 80, 1320, 920), fill=(240, 245, 235))
d.rounded_rectangle((150, 150, 1250, 800), radius=80, fill=(255, 255, 255), outline=(80, 180, 110), width=14)
d.text((280, 340), 'PANEER BOWL', fill=(30, 30, 30), font=ImageFont.truetype('arial.ttf', 110))
d.text((260, 500), 'HIGH PROTEIN MEAL', fill=(60, 120, 80), font=ImageFont.truetype('arial.ttf', 70))
d.rectangle((200, 640, 1200, 700), fill=(90, 190, 120))
img.save(img_path)

print('IMAGE_SIZE_BYTES', os.path.getsize(img_path))

s = requests.Session()
login = s.post(f'{backend}/api/auth/login', json={'email': 'ben10@gmail.com', 'password': 'tennyson'}, timeout=20)
print('LOGIN_STATUS', login.status_code)
print('LOGIN_BODY', login.json())

chat = s.post(
    f'{backend}/api/chatbot/query',
    json={
        'message': 'Give me a simple meal plan for weight loss',
        'chatHistory': [
            {'role': 'user', 'text': 'Give me a simple meal plan for weight loss'},
            {'role': 'assistant', 'text': 'Sure, I can help.'},
        ],
    },
    timeout=25,
)
print('CHAT_STATUS', chat.status_code)
print('CHAT_BODY', chat.json())

with open(img_path, 'rb') as f:
    upload = s.post(
        f'{backend}/api/chatbot/scan-label',
        files={'labelImage': ('clear_food.png', f, 'image/png')},
        timeout=35,
    )
print('UPLOAD_STATUS', upload.status_code)
print('UPLOAD_BODY', upload.text)

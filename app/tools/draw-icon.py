import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

out = sys.argv[1]
scale = 2
size = 1024 * scale

def lerp(first, second, amount):
    return tuple(round(first[channel] + (second[channel] - first[channel]) * amount) for channel in range(3))

top, base = (0x2a, 0x2c, 0x31), (0x0f, 0x10, 0x12)
canvas = Image.new('RGB', (size, size))
painter = ImageDraw.Draw(canvas)
for row in range(size):
    painter.line([(0, row), (size, row)], fill=lerp(top, base, row / size))

glow = Image.new('L', (size, size), 0)
ImageDraw.Draw(glow).ellipse([size * 0.1, -size * 0.45, size * 0.9, size * 0.45], fill=45)
glow = glow.filter(ImageFilter.GaussianBlur(size * 0.12))
canvas = Image.composite(Image.new('RGB', (size, size), (255, 255, 255)), canvas, glow)

shadow = Image.new('L', (size, size), 0)
paper_left, paper_top, paper_right, paper_bottom = size * 0.27, size * 0.2, size * 0.73, size * 0.8
corner = size * 0.04
fold = size * 0.12
ImageDraw.Draw(shadow).rounded_rectangle([paper_left, paper_top + size * 0.025, paper_right, paper_bottom + size * 0.025], radius=corner, fill=120)
shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.03))
canvas = Image.composite(Image.new('RGB', (size, size), (0, 0, 0)), canvas, shadow)

paper = Image.new('L', (size, size), 0)
paper_painter = ImageDraw.Draw(paper)
paper_painter.rounded_rectangle([paper_left, paper_top, paper_right, paper_bottom], radius=corner, fill=255)
paper_painter.polygon([(paper_right - fold, paper_top - 2), (paper_right + 2, paper_top - 2), (paper_right + 2, paper_top + fold)], fill=0)
canvas = Image.composite(Image.new('RGB', (size, size), (250, 250, 250)), canvas, paper)
ImageDraw.Draw(canvas).polygon([(paper_right - fold, paper_top), (paper_right - fold, paper_top + fold), (paper_right, paper_top + fold)], fill=(205, 207, 212))

painter = ImageDraw.Draw(canvas)
font = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', round(size * 0.27))
try:
    font.set_variation_by_name('Black')
except Exception:
    font.set_variation_by_axes([900])
mark = 'F*'
box = painter.textbbox((0, 0), mark, font=font)
mark_width, mark_height = box[2] - box[0], box[3] - box[1]
mark_left = (paper_left + paper_right) / 2 - mark_width / 2 - box[0]
mark_top = paper_top + size * 0.1 - box[1]
painter.text((mark_left, mark_top), mark, font=font, fill=(0x16, 0x17, 0x1a))

line_left, line_right = paper_left + size * 0.07, paper_right - size * 0.07
for index, width_share in enumerate([1.0, 0.82, 0.6]):
    line_top = paper_top + size * (0.37 + index * 0.065)
    painter.rounded_rectangle([line_left, line_top, line_left + (line_right - line_left) * width_share, line_top + size * 0.028], radius=size * 0.014, fill=(214, 216, 221))

canvas.resize((1024, 1024), Image.LANCZOS).save(out)

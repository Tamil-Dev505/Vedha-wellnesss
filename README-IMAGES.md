Image conversion for better performance

This project includes a helper script to convert the gallery JPEG images to WebP, which reduces download size and speeds up page load.

Steps:

1. Create a Python environment (optional but recommended):

```bash
python -m venv .venv
.venv\Scripts\activate
```

2. Install Pillow:

```bash
pip install pillow
```

3. Run the converter from the project root:

```bash
python convert_images.py
```

This writes `.webp` files next to the originals in `images/Vedha Wellness/`.

After conversion the site will automatically attempt to load the `.webp` files when the browser supports WebP.

# Model guidelines for phones

- Aim for models under about 10 MB. The editor warns above 15 MB; large models can be slow or crash on older phones.
- Phones have much less memory than computers. An iPhone browser tab can be closed by the system when it uses too much.
- Reduce triangles (Blender has a Decimate modifier) and shrink textures.
- Compressed models (Draco or Meshopt) are supported by the viewer. gltf-transform is a free tool for this; check its official docs for the exact commands.
- Use MP3 for sound. OGG often does not play on iPhone.
- Test on a real phone before sharing a link.
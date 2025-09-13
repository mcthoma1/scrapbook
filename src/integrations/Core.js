export async function UploadFile({ file }) {
  if (!file) {
    console.error('UploadFile requires a file');
    return { file_url: null };
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return { file_url: data.file_url };
  } catch (error) {
    console.error('UploadFile error:', error);
    return { file_url: null };
  }
}

export default UploadFile;

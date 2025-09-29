import axios from "axios";

const API_BASE = "http://10.26.201.50:3000"; 

export async function uploadAndExtractText(fileUri: string, fileName: string) {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: "application/pdf",
    } as any);

    const res = await axios.post(`${API_BASE}/extract-text`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data; // text, numpages, info 
  } catch (err: any) {
    console.error("PDF upload/extract failed:", err.message || err);
    throw err;
  }
}

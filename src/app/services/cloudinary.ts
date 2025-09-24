// src/app/services/cloudinary.ts
import api from "@/lib/api";

type CloudinarySig = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
};

/** Pide al backend la firma para subir a Cloudinary a una carpeta dada. */
export async function getCloudinarySignature(folder: string): Promise<CloudinarySig> {
  const res = await api.get<CloudinarySig>(`/cloudinary/signature`, { params: { folder } });
  return res.data;
}

/** Sube un archivo a Cloudinary (signed upload) y devuelve la URL segura. */
export async function uploadToCloudinary(file: File, folder = "pignoraticios/solicitudes"): Promise<string> {
  const sig = await getCloudinarySignature(folder);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`;

  const resp = await fetch(endpoint, { method: "POST", body: form });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Error subiendo a Cloudinary: ${resp.status} ${txt}`);
    }
  const json = await resp.json();
  // secure_url = https
  return json.secure_url as string;
}

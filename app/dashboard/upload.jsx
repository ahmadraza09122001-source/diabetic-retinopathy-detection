'use client';
import { useState } from "react";

export default function UploadImage() {
    const [file, setFile] = useState(null);

    const handleUpload = async () => {
        if (!file) return alert("Select a file first!");

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        alert(data.message);
    };

    return (
        <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload}>Upload</button>
        </div>
    );
}

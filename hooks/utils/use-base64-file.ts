import { useState, useCallback } from "react";

export const useBase64File = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setIsConverting(true);
      const reader = new FileReader();
      reader.onload = () => {
        setIsConverting(false);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        setIsConverting(false);
        reject(new Error("Failed to convert file to base64"));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  return { convertToBase64, isConverting };
};

import React, { useEffect, useState } from "react";
import { ImagePlus, Link2, FolderOpen } from "lucide-react";

import { Modal } from "./Modal.jsx";
import { Field } from "../ui/Field.jsx";
import {
  DownloadPlankFromURL,
  ImportPlankFile,
  OpenImportImage,
} from "../../../wailsjs/go/application/App.js";

const AddPlankModal = ({
  isOpen,
  onClose,
  onAdded,
  themeClasses,
  locale,
  recommendedWidth,
  recommendedHeight,
}) => {
  const [url, setUrl] = useState("");
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setUrl("");
    setFilePath("");
    setLoading(false);
    setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChooseFile = async () => {
    try {
      const selected = await OpenImportImage();
      if (selected) {
        setFilePath(selected);
        setError("");
      }
    } catch (err) {
      setError(String(err?.message ?? err));
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    const trimmedURL = url.trim();
    if (!trimmedURL && !filePath) {
      setError(locale.AddLogoEmptyError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const info = trimmedURL
        ? await DownloadPlankFromURL(trimmedURL)
        : await ImportPlankFile(filePath);

      await onAdded?.(info);
      onClose?.();
    } catch (err) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3
        h-[56px] rounded-xl
        font-black uppercase italic tracking-wider text-white
        bg-blue-600 hover:bg-blue-500
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <ImagePlus size={18} />
      {loading ? locale.AddingPlank : locale.AddPlankButton}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={locale.AddPlankModalTitle}
      icon={ImagePlus}
      iconColor="blue"
      themeClasses={themeClasses}
      footer={footer}
    >
      <div className="p-6 space-y-4">
        <Field
          label={locale.ImageUrlLabel}
          icon={Link2}
          value={url}
          onChange={(value) => {
            setUrl(value);
            if (error) setError("");
          }}
          placeholder="https://example.com/plank.png"
          themeClasses={themeClasses}
        />

        <div className="flex items-center gap-3 text-[10px] font-black uppercase opacity-40">
          <div className="flex-1 h-px bg-current/20" />
          {locale.OrLabel}
          <div className="flex-1 h-px bg-current/20" />
        </div>

        <Field
          variant="button"
          icon={FolderOpen}
          labelButton={locale.ChooseFileButton}
          height="2.4rem"
          themeClasses={themeClasses}
          onClick={handleChooseFile}
        />

        {filePath && (
          <div className="text-[10px] font-mono opacity-60 break-all">
            {filePath}
          </div>
        )}

        {error && (
          <div className="text-xs font-bold text-red-500 break-words">
            {error}
          </div>
        )}

        <p className="text-[10px] opacity-50 leading-relaxed">
          {locale.AddLogoUrlHint}
        </p>

        {recommendedWidth > 0 && recommendedHeight > 0 && (
          <p className="text-[10px] font-bold opacity-60">
            {locale.PlankRecommendedSizeLabel}:{" "}
            {recommendedWidth} × {recommendedHeight} px
          </p>
        )}
      </div>
    </Modal>
  );
};

export default AddPlankModal;

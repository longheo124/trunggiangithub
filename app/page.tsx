"use client";

import { FormEvent, useState } from "react";

type ApiError = {
  error: string;
};

type FileResponse = {
  content: string;
  sha: string;
  path: string;
};

export default function Home() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [path, setPath] = useState("");
  const [commitMessage, setCommitMessage] = useState("Update via GitHub bridge");
  const [fileContent, setFileContent] = useState("");
  const [sha, setSha] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const resetStatus = () => setStatus(null);

  const handleLoad = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    if (!owner || !repo || !path) {
      setStatus("Vui lòng điền đủ thông tin kho, chủ sở hữu và đường dẫn file.");
      return;
    }

    try {
      setIsBusy(true);
      const response = await fetch(
        `/api/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
          repo
        )}&path=${encodeURIComponent(path)}`
      );

      const data: FileResponse | ApiError = await response.json();
      if (!response.ok) {
        throw new Error((data as ApiError).error);
      }

      const file = data as FileResponse;
      setFileContent(file.content);
      setSha(file.sha);
      setStatus(`Đã tải file ${file.path}.`);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error ? error.message : "Không thể tải file từ GitHub."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    resetStatus();

    if (!owner || !repo || !path) {
      setStatus("Vui lòng cung cấp đầy đủ thông tin trước khi lưu.");
      return;
    }

    try {
      setIsBusy(true);
      const response = await fetch("/api/github/file", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          owner,
          repo,
          path,
          content: fileContent,
          message: commitMessage,
          sha
        })
      });

      const data: ApiError | FileResponse = await response.json();
      if (!response.ok) {
        throw new Error((data as ApiError).error);
      }

      const file = data as FileResponse;
      setSha(file.sha);
      setStatus(`Đã lưu thay đổi cho ${file.path}.`);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật file trên GitHub."
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    resetStatus();

    if (!owner || !repo || !path) {
      setStatus("Cần cung cấp đủ thông tin trước khi xóa.");
      return;
    }

    if (!sha) {
      setStatus("Hãy tải file trước khi xóa để lấy thông tin SHA hiện tại.");
      return;
    }

    if (!confirm(`Bạn chắc chắn muốn xóa ${path}?`)) {
      return;
    }

    try {
      setIsBusy(true);
      const response = await fetch("/api/github/file", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ owner, repo, path, message: commitMessage, sha })
      });

      const data: ApiError | { ok: true } = await response.json();
      if (!response.ok) {
        throw new Error((data as ApiError).error);
      }

      setFileContent("");
      setSha(null);
      setStatus(`Đã xóa ${path} khỏi kho ${owner}/${repo}.`);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error ? error.message : "Không thể xóa file trên GitHub."
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">GitHub Content Bridge</h1>
        <p className="text-sm text-slate-400">
          Xem, chỉnh sửa và xóa file trong repository GitHub trực tiếp từ giao diện
          Vercel.
        </p>
      </header>

      <form
        onSubmit={handleLoad}
        className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="owner">
            Chủ sở hữu (user hoặc tổ chức)
          </label>
          <input
            id="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="vd: vercel"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="repo">
            Repository
          </label>
          <input
            id="repo"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="vd: next.js"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="path">
            Đường dẫn file (ví dụ: README.md hoặc docs/intro.md)
          </label>
          <input
            id="path"
            value={path}
            onChange={(event) => setPath(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="ví dụ: README.md"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="message">
            Commit message
          </label>
          <input
            id="message"
            value={commitMessage}
            onChange={(event) => setCommitMessage(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="vd: Cập nhật nội dung"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700"
          disabled={isBusy}
        >
          {isBusy ? "Đang tải..." : "Tải file"}
        </button>
      </form>

      <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nội dung file</h2>
          {sha && <span className="text-xs text-slate-500">SHA: {sha}</span>}
        </div>
        <textarea
          value={fileContent}
          onChange={(event) => setFileContent(event.target.value)}
          className="min-h-[320px] rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
          placeholder="Nội dung sẽ hiển thị tại đây sau khi bạn tải file."
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isBusy}
          >
            {isBusy ? "Đang xử lý..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            disabled={isBusy}
          >
            {isBusy ? "Đang xử lý..." : "Xóa file"}
          </button>
        </div>
      </section>

      {status && (
        <div className="rounded-md border border-slate-700 bg-slate-900/60 p-3 text-sm">
          {status}
        </div>
      )}

      <footer className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
        <p>
          Ứng dụng sử dụng GitHub REST API. Hãy cấu hình biến môi trường
          <code className="mx-1 rounded bg-slate-800 px-1 py-0.5 text-[0.7rem] text-slate-200">
            GITHUB_TOKEN
          </code>
          trên Vercel với quyền repo để có thể chỉnh sửa nội dung.
        </p>
        <p>
          Mọi thao tác đều tạo commit mới. Hãy kiểm tra kỹ thông tin repository và
          commit message trước khi lưu hoặc xóa.
        </p>
      </footer>
    </main>
  );
}

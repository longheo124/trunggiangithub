import { NextRequest, NextResponse } from "next/server";
import { deleteFile, getFile, GitHubApiError, updateFile } from "@/lib/github";

const parseBody = async <T>(request: NextRequest): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch (error) {
    throw new GitHubApiError("Dữ liệu gửi lên không hợp lệ.", 400);
  }
};

const ensureRequired = (
  values: Record<string, string | null | undefined>,
  message: string
) => {
  const missing = Object.entries(values).filter(([, value]) => !value);
  if (missing.length) {
    throw new GitHubApiError(message, 400);
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  try {
    ensureRequired(
      { owner, repo, path },
      "Thiếu thông tin owner/repo/path để tải file."
    );

    const file = await getFile({ owner: owner!, repo: repo!, path: path! });
    return NextResponse.json(file);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi không xác định khi tải file." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await parseBody<{
      owner: string;
      repo: string;
      path: string;
      content: string;
      message?: string;
      sha?: string | null;
    }>(request);

    ensureRequired(
      { owner: body.owner, repo: body.repo, path: body.path },
      "Thiếu thông tin owner/repo/path để lưu file."
    );

    const file = await updateFile({
      owner: body.owner,
      repo: body.repo,
      path: body.path,
      content: body.content ?? "",
      message: body.message ?? "Update file via GitHub Content Bridge",
      sha: body.sha
    });

    return NextResponse.json(file);
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi không xác định khi lưu file." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await parseBody<{
      owner: string;
      repo: string;
      path: string;
      message?: string;
      sha?: string;
    }>(request);

    ensureRequired(
      { owner: body.owner, repo: body.repo, path: body.path, sha: body.sha },
      "Thiếu thông tin owner/repo/path/sha để xóa file."
    );

    await deleteFile({
      owner: body.owner,
      repo: body.repo,
      path: body.path,
      message: body.message ?? "Delete file via GitHub Content Bridge",
      sha: body.sha!
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof GitHubApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi không xác định khi xóa file." },
      { status: 500 }
    );
  }
}

import type { Project } from 'app/src-common/entities';
import path from 'path';
import fse from 'fs-extra';

export async function readProjectFromPath(
  fullFilePath: string,
): Promise<Project> {
  const ext = path.extname(fullFilePath).toLowerCase();
  if (ext !== '.json' && ext !== '.bpp') {
    throw new Error(
      `Unsupported extension "${ext}". Only .json or .bpp allowed.`,
    );
  }

  const exists = await fse.pathExists(fullFilePath);
  if (!exists) {
    throw new Error(`File not found: ${fullFilePath}`);
  }

  try {
    return await fse.readJSON(fullFilePath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Failed to read file "${fullFilePath}": ${(err as Error).message}`,
    );
  }
}

export async function writeProjectToPath(
  project: Project,
  fullFilePath: string,
): Promise<string> {
  let ext = path.extname(fullFilePath).toLowerCase();
  if (ext !== '.json' && ext !== '.bpp') {
    // If the user didn’t supply a valid extension, default to .json
    ext = '.bpp';
    fullFilePath = fullFilePath + ext;
  }

  const parentDir = path.dirname(fullFilePath);
  try {
    await fse.ensureDir(parentDir);
  } catch (err: unknown) {
    throw new Error(
      `Cannot create directory "${parentDir}": ${getErrorMessage(err)}`,
    );
  }

  try {
    await fse.writeJSON(fullFilePath, project, 'utf-8');
  } catch (err: unknown) {
    throw new Error(
      `Failed to write project to "${fullFilePath}": ${getErrorMessage(err)}`,
    );
  }

  return fullFilePath;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}

export async function deleteProjectFromPath(fullFilePath: string) {
  try {
    await fse.unlink(fullFilePath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }
}

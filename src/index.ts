#!/usr/bin/env node

import _ from 'underscore';
import miminist from 'minimist';
import path from 'path';
import { JWT } from 'google-auth-library';
import { createReadStream, existsSync, readFileSync } from 'fs';
import { drive_v3, google } from 'googleapis';

const filePathArgName = 'file';
const uploadPathArgName = 'upload-path';
const keyPathArgName = 'key-file';
const GoogleFolderMimeType = `application/vnd.google-apps.folder`;

const argv = miminist(process.argv.slice(2));
const filePath = argv[filePathArgName];
const uploadPath = argv[uploadPathArgName];
const keyPath = argv[keyPathArgName];

const getClient = (): drive_v3.Drive => {
  const keysString = readFileSync(keyPath).toString();
  const keys = JSON.parse(keysString);

  const auth = new JWT({
    email: keys.client_email,
    key: keys.private_key,
    scopes: 'https://www.googleapis.com/auth/drive',
  });

  const drive = google.drive({ version: 'v3', auth });

  return drive;
};

const getFiles = async (driveClient: drive_v3.Drive) => {
  return await driveClient.files.list({
    fields: 'files(id,name,parents,mimeType)',
    q: 'trashed:false',
  });
};

const getOrCreateParentId = async (
  driveClient: drive_v3.Drive,
  googleFileData: drive_v3.Schema$File[],
  pathSegments: string[],
  currentIndex: number,
  parentId?: string
): Promise<string> => {
  if (currentIndex >= pathSegments.length) {
    return parentId;
  }

  const ascii = currentIndex + 1 < pathSegments.length ? '├' : '└';

  const googleFile =
    parentId !== undefined
      ? _.find(
          googleFileData,
          (file) =>
            file.mimeType == GoogleFolderMimeType &&
            file.name == pathSegments[currentIndex] &&
            _.contains(file.parents, parentId)
        )
      : _.find(
          googleFileData,
          (file) =>
            file.mimeType == GoogleFolderMimeType &&
            file.name == pathSegments[currentIndex]
        );

  if (googleFile !== undefined) {
    console.log(
      `   ${ascii} ${pathSegments[currentIndex]}: found! (ID ${googleFile.id})`
    );

    return await getOrCreateParentId(
      driveClient,
      googleFileData,
      pathSegments,
      currentIndex + 1,
      googleFile.id
    );
  }

  console.log(`   ${ascii} ${pathSegments[currentIndex]}: creating...`);

  const parents = parentId === undefined ? {} : { parents: [parentId] };

  const file = await driveClient.files.create({
    requestBody: {
      name: pathSegments[currentIndex],
      ...parents,
      mimeType: GoogleFolderMimeType,
    },
    fields: 'id',
  });

  googleFileData.push({
    id: file.data.id,
    name: pathSegments[currentIndex],
    mimeType: GoogleFolderMimeType,
    ...parents,
  });

  return await getOrCreateParentId(
    driveClient,
    googleFileData,
    pathSegments,
    currentIndex + 1,
    file.data.id
  );
};

const getUploadPathId = async (
  driveClient: drive_v3.Drive
): Promise<string> => {
  console.log(`\n🔍 Getting ID for upload path ${uploadPath}...`);

  const files = await getFiles(driveClient);

  const parentId = await getOrCreateParentId(
    driveClient,
    files.data.files,
    uploadPath.split(path.sep),
    0,
    undefined
  );

  console.log(`\n🏷  Using parent ID ${parentId} for upload.\n`);

  return parentId;
};

const uploadFile = async (): Promise<{
  name: string;
  id: string;
  path: string;
}> => {
  if (keyPath === undefined) {
    console.error(
      `A key file was not specified! Please specify via the --${keyPathArgName} argument.`
    );
    process.exit(1);
  }
  if (filePath === undefined) {
    console.error(
      `File to upload not specified! Please specify via the --${filePathArgName} argument.`
    );
    process.exit(1);
  }
  if (!existsSync(filePath)) {
    console.error(`The file to upload specified was not found! ${filePath}`);
    process.exit(1);
  }

  const drive = getClient();
  const filename = path.basename(filePath);
  const parentId =
    uploadPath !== undefined ? await getUploadPathId(drive) : undefined;
  const parents = parentId === undefined ? {} : { parents: [parentId] };

  const file = await drive.files.create({
    requestBody: {
      name: filename,
      mimeType: 'application/zip',
      ...parents,
    },
    media: {
      mimeType: 'application/zip',
      body: createReadStream(filePath),
    },
    fields: 'id',
  });

  return {
    id: file.data.id,
    name: filename,
    path: uploadPath === undefined ? 'Google Drive' : `'${uploadPath}'`,
  };
};

uploadFile().then((file) =>
  console.log(
    `🎊 The file '${file.name}' was successfully uploaded to ${file.path}! (ID ${file.id})\n`
  )
);

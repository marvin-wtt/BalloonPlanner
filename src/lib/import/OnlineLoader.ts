import axios from 'axios';

interface LoaderConfig {
  server: string;
  id: string;
  username: string;
  password: string;
}

export async function load(config: LoaderConfig) {
  const response = await axios.get(config.server, {
    params: {
      postId: config.id,
    },
    auth: {
      username: config.username,
      password: config.password,
    },
  });

  return response.data;
}

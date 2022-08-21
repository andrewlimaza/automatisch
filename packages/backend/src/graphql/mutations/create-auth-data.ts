import Context from '../../types/express/context';
import axios from 'axios';

type Params = {
  input: {
    id: string;
  };
};

const createAuthData = async (
  _parent: unknown,
  params: Params,
  context: Context
) => {
  const connection = await context.currentUser
    .$relatedQuery('connections')
    .findOne({
      id: params.input.id,
    })
    .throwIfNotFound();

  const appClass = (await import(`../../apps/${connection.key}`)).default;

  if (!connection.formattedData) {
    return null;
  }

  const appInstance = new appClass(connection);
  const authLink = await appInstance.authenticationClient.createAuthData();

  try {
    await axios.get(authLink.url);
  } catch (error) {
    throw new Error('Error occured while creating authorization URL!');
  }

  await connection.$query().patch({
    formattedData: {
      ...connection.formattedData,
      ...authLink,
    },
  });

  return authLink;
};

export default createAuthData;

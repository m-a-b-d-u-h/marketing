const BASE = "https://api.buffer.com";

export async function getChannels(token) {
  const orgQuery = `query { account { organizations { id } } }`;
  const orgData = await graphql(token, orgQuery);
  const orgs = orgData.account?.organizations ?? [];
  if (!orgs.length) return { organizations: [], channels: [] };

  const chQuery = `query ($orgId: OrganizationId!) {
    channels(input: { organizationId: $orgId }) {
      id name service
    }
  }`;
  const chData = await graphql(token, chQuery, { orgId: orgs[0].id });
  const channels = chData.channels ?? [];
  return { organizations: orgs, channels };
}

export async function createPost(token, channelId, text, videoUrl, service, videoTitle, thumbnailOffset) {
  const videoAsset = { url: videoUrl };
  if (thumbnailOffset != null) {
    videoAsset.metadata = { thumbnailOffset };
  }

  const input = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "shareNow",
    assets: videoUrl ? [{ video: videoAsset }] : [],
  };

  const metadata = buildMetadata(service, videoUrl, videoTitle);
  if (metadata) input.metadata = metadata;

  const query = `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id text dueAt }
      }
      ... on MutationError { message }
    }
  }`;

  return graphql(token, query, { input });
}

function buildMetadata(service, videoUrl, videoTitle) {
  switch (service) {
    case "instagram":
      return { instagram: { type: "post", shouldShareToFeed: true } };
    case "youtube":
      return { youtube: { title: videoTitle || "1section", privacy: "public", categoryId: "24" } };
    case "twitter":
      return null;
    default:
      return null;
  }
}

async function graphql(token, query, variables = {}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Buffer GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }

  return json.data;
}

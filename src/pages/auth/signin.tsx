import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { getProviders, signIn } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

export default function SignIn({ providers }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center">
			<div className="text-3xl font-semibold">Sign in</div>
			{Object.values(providers).map((provider) => (
				<div key={provider.name}>
					<button
						className="mb-8 mt-4 cursor-pointer border-2 border-white bg-gray-1000 px-4 py-2 text-lg font-semibold hover:enabled:bg-white hover:enabled:text-black disabled:border-gray-500 disabled:text-gray-500 md:px-5 md:py-3 md:text-xl"
						onClick={() => signIn(provider.id)}
					>
						Sign in with {provider.name}
					</button>
				</div>
			))}
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, authOptions);

	if (session) {
		return { redirect: { destination: '/' } };
	}

	const providers = await getProviders();

	return {
		props: { providers: providers ?? [] },
	};
}

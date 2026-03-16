export default function Home() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
      <main className='flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start'>
        <h1 className='text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl'>
          Welcome to Nutripare
        </h1>
        <p className='mt-6 text-lg text-gray-600 dark:text-gray-300'>
          Make healthier food choices by easily comparing the nutritional
          information of different food items. With Nutripare, you can quickly
          analyze and compare the nutritional content of various foods to make
          informed decisions about your diet. Whether you&apos;re looking to
          lose weight, gain muscle, or simply eat healthier, Nutripare is here
          to help you achieve your goals.
        </p>
      </main>
    </div>
  );
}

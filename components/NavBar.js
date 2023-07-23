import Link from "next/link";


const Navbar = () => {
  return (
    <>
      <nav className='flex items-center flex-wrap p-3 '>
        <Link href='/'>
          <li className='inline-flex items-center p-2 mr-4 '>
            <span className='text-xl text-white font-bold tracking-wide'>
              Carlos Liang
            </span>
          </li>
        </Link>
        <button className=' inline-flex p-3 hover:bg-gray-900 rounded lg:hidden text-white ml-auto hover:text-white outline-none'>
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        <div className='hidden w-full lg:inline-flex lg:flex-grow lg:w-auto'>
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start  flex flex-col lg:h-auto'>
            <Link href='/'>
              <li className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center  '>
                Home
              </li>
            </Link>
            <Link href='/'>
              <li className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center'>
                Services
              </li>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;
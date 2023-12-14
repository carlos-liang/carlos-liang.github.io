import Link from "next/link";
import { TiHome } from "react-icons/ti";
import { SiGithub, SiLinkedin } from "react-icons/si";

const Navbar = () => {
  return (
    <>
      <nav className='absolute flex items-center flex-wrap p-3 px-16 z-50 w-full'>
        <Link href='/'>
          <li className='inline-flex items-center p-2 mr-4 '>
            <span className='text-xl text-white font-bold tracking-wide'>
              Carlos Liang
            </span>
          </li>
        </Link>
        <div className='absolute right-0 mr-10 w-full lg:flex-grow lg:w-auto'>
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start flex flex-col lg:h-auto'>
            <Link href='https://github.com/carlos-liang' target='_blank' rel='noopener noreferrer'>
              <li className='lg:inline-flex lg:w-auto w-full rounded text-white font-bold items-center justify-center mr-5 hover:text-blue-900 transition ease-in-out delay-150'>
                <SiGithub size={21}/>
              </li>
            </Link>
            <Link href='https://www.linkedin.com/in/carlosl97/' target='_blank' rel='noopener noreferrer'>
              <li className='lg:inline-flex lg:w-auto w-full rounded text-white font-bold items-center justify-center mr-5 hover:text-[#0077B5] hover:bg-white transition ease-in-out delay-150'>
                <SiLinkedin  size={21}/>
              </li>
            </Link>
            <Link href='/About'>
              <li className='lg:inline-flex lg:w-auto w-full rounded text-white font-bold items-center justify-center hover:text-gray-700 transition ease-in-out delay-150'>
                <TiHome size={21}/>
              </li>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export default Navbar;


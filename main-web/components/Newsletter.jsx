import React from 'react'

export const Newsletter = () => {
  return (
    <>
    
    {/* Newsletter */}
<section className="my-12 bg-gray-900 text-white py-12 px-6 text-center">
  <h2 className="text-2xl md:text-3xl font-bold">Join Our Newsletter</h2>
  <p className="mt-2 text-gray-300">Be the first to know about new arrivals and special offers.</p>
  <form className="mt-6 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
    <input
      type="email"
      placeholder="Enter your email"
      className="px-4 py-2 rounded-full text-gray-900 w-full sm:w-auto flex-grow"
    />
    <button className="px-6 py-2 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition">
      Subscribe
    </button>
  </form>
</section>

    
    </>
  )
}

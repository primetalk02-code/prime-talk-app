import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function CreateLesson() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('categories').select('id, name').order('name')

        if (error) {
          console.error('Error fetching categories:', error)
          return
        }

        setCategories(data || [])

        if (data && data.length > 0) {
          setSelectedCategory(String(data[0].id))
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchCategories()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      const { data, error } = await supabase
        .from('textbooks')
        .insert({
          title,
          content,
          category_id: selectedCategory,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating lesson:', error)
        return
      }

      navigate(`/lesson-details/${data.id}`)
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f7f8fc' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', background: '#fff', padding: '24px', borderRadius: '12px' }}>
        <h1 style={{ marginTop: 0 }}>Create Lesson</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              required
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={10}
              required
              style={{ width: '100%', marginTop: '8px', padding: '10px' }}
            />
          </div>

          <button type="submit">Create Lesson</button>
        </form>
      </div>
    </div>
  )
}

export default CreateLesson

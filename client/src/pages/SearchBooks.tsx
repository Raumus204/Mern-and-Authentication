import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_BOOK } from '../utils/mutations';
import { QUERY_USER } from '../utils/queries';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import Auth from '../utils/auth';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import type { Book } from '../models/Book';

interface QueryUserResponse {
  me: {
    savedBooks: Book[];
  };
}

const SearchBooks = () => {
  const [saveBook] = useMutation(ADD_BOOK);
  const { data } = useQuery<QueryUserResponse>(QUERY_USER, {
    skip: !Auth.loggedIn(), // Skip query if not logged in
  });
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState<string[]>(getSavedBookIds());

  // Reset savedBookIds when the logged-in user changes
  useEffect(() => {
    if (data?.me) {
      const userSavedBookIds = data.me.savedBooks.map((book) => book.bookId);
      setSavedBookIds(userSavedBookIds);
      saveBookIds(userSavedBookIds);
    }
  }, [data]);

  useEffect(() => () => saveBookIds(savedBookIds), [savedBookIds]);

  const searchGoogleBooks = async (query: string) => {
    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
      if (!response.ok) throw new Error('Something went wrong!');
      const { items } = await response.json();
      return items.map(({ id, volumeInfo }: any) => ({
        bookId: id,
        authors: volumeInfo.authors || ['No author to display'],
        title: volumeInfo.title,
        description: volumeInfo.description,
        image: volumeInfo.imageLinks?.thumbnail || '',
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchInput) return;
    setSearchedBooks(await searchGoogleBooks(searchInput));
    setSearchInput('');
  };

  const handleSaveBook = async (bookId: string) => {
    if (!Auth.loggedIn()) return;
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    if (!bookToSave) return;

    try {
      await saveBook({
        variables: { book: { ...bookToSave } },
        update: (cache, { data: { saveBook } }) => {
          const existingData = cache.readQuery<QueryUserResponse>({ query: QUERY_USER });

          if (existingData) {
            cache.writeQuery({
              query: QUERY_USER,
              data: {
                me: {
                  ...existingData.me,
                  savedBooks: [...existingData.me.savedBooks, bookToSave],
                },
              },
            });
          }
        },
      });

      setSavedBookIds((prevIds) => [...prevIds, bookToSave.bookId]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>Submit Search</Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length ? `Viewing ${searchedBooks.length} results:` : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map(({ bookId, image, title, authors, description }) => (
            <Col md='4' key={bookId}>
              <Card border='dark'>
                {image && <Card.Img src={image} alt={`The cover for ${title}`} variant='top' />}
                <Card.Body>
                  <Card.Title>{title}</Card.Title>
                  <p className='small'>Authors: {authors}</p>
                  <Card.Text>{description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds.includes(bookId)}
                      className='btn-block btn-info'
                      onClick={() => handleSaveBook(bookId)}>
                      {savedBookIds.includes(bookId) ? 'This book has already been saved!' : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;
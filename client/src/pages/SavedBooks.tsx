import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client';
import { DELETE_BOOK } from '../utils/mutations';
import { QUERY_USER } from '../utils/queries';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { Book } from '../models/Book';

interface QueryUserResponse {
  me: {
    username: string;
    savedBooks: Book[];
  };
}

const SavedBooks = () => {
  // Fetch the user's saved books using the QUERY_USER query
  const { loading, data, refetch } = useQuery<QueryUserResponse>(QUERY_USER);
  const userData = data?.me || { savedBooks: [], username: '' };
  const savedBooks: Book[] = userData.savedBooks || [];

  // Mutation to delete a book
  const [removeBook] = useMutation(DELETE_BOOK);

  // Handle deleting a book
  const handleDeleteBook = async (bookId: string) => {
    if (!Auth.loggedIn()) return;

    try {
      // Call the DELETE_BOOK mutation
      await removeBook({ variables: { bookId } });
      // Remove the book ID from local storage
      removeBookId(bookId);
      // Refetch the user's saved books to update the UI
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Show a loading message while the data is being fetched
  if (loading) return <h2>LOADING...</h2>;

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          <h1>Viewing {userData.username ? `${userData.username}'s` : ''} saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {savedBooks.length
            ? `Viewing ${savedBooks.length} saved ${savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {savedBooks.map(({ bookId, image, title, authors, description }) => (
            <Col key={bookId} md='4'>
              <Card border='dark'>
                {image && <Card.Img src={image} alt={`The cover for ${title}`} variant='top' />}
                <Card.Body>
                  <Card.Title>{title}</Card.Title>
                  <p className='small'>Authors: {authors}</p>
                  <Card.Text>{description}</Card.Text>
                  <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(bookId)}>
                    Delete this Book!
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
import React, { useState, useEffect } from "react";
import "./App.css";
import { API } from "aws-amplify";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { listStudents } from "./graphql/queries";
import {
  createStudent as createStudentMutation,
  deleteStudent as deleteStudentMutation,
  updateStudent as updateStudentMutation,
} from "./graphql/mutations";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(2),
      width: theme.spacing(26),
      height: theme.spacing(25),
    },
  },
  main: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(2),
      width: theme.spacing(30),
      height: theme.spacing(44),
    },
  },
}));

const initialFormState = { name: "", mark1: "", mark2: "" };

function App() {
  const classes = useStyles();
  const [Students, setStudents] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [editing, setEditing] = useState(false);
  const [status, setstatus] = useState("");
  const [validation, setValidation] = useState("");
  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const apiData = await API.graphql({ query: listStudents });
    const StudentsFromAPI = apiData.data.listStudents.items;
    await Promise.all(
      StudentsFromAPI.map(async (Student) => {
        return Student;
      })
    );
    setStudents(apiData.data.listStudents.items);
  }

  function nameValidation(data) {
    if (data.name.length < 4 || data.name.length > 16) {
      setValidation("Name should be between 4 - 16 characters");
      return false;
    }
    const regexp = new RegExp(`^-?[A-Za-z]*$`);
    if (!regexp.test(data.name)) {
      setValidation("Invalid name! Try Again !");
      return false;
    }
    return true;
  }

  function marksValidation(data) {
    if (
      data.mark1 > 100 ||
      data.mark1 < 0 ||
      data.mark2 > 100 ||
      data.mark2 < 0
    ) {
      setValidation("Mark should be between 0-100");
      return false;
    }
    return true;
  }

  async function createStudent() {
    setValidation("");
    setstatus("");
    if (!formData.name || !formData.mark1 || !formData.mark2) {
      setValidation("Fields Cannot be empty!");
      return;
    }
    if (!nameValidation(formData)) {
      return;
    }
    if (!marksValidation(formData)) {
      return;
    }

    try {
      await API.graphql({
        query: createStudentMutation,
        variables: { input: formData },
      });
    } catch {
      setValidation("Try Again! (Mark should be a number)");
      return;
    }

    fetchStudents(); //
    setFormData(initialFormState);
    setstatus("Created!");
  }

  async function deleteStudent({ id }) {
    setstatus("");
    setValidation("");
    const newStudentsArray = Students.filter((Student) => Student.id !== id);
    setStudents(newStudentsArray);
    await API.graphql({
      query: deleteStudentMutation,
      variables: { input: { id } },
    });
    setstatus("Deleted!");
  }

  const editStudent = (Student) => {
    setValidation("");
    setstatus("");
    setEditing(true);
    const data = {
      id: Student.id,
      name: Student.name,
      mark1: Student.mark1,
      mark2: Student.mark2,
    };
    setFormData(data);
    setstatus("Editing..");
  };

  async function updateStudent() {
    setValidation("");
    setstatus("");
    if (!formData.name || !formData.mark1 || !formData.mark2) {
      setValidation("Fields Cannot be empty!");
      return;
    }
    if (!nameValidation(formData)) {
      return;
    }
    if (!marksValidation(formData)) {
      return;
    }

    try {
      await API.graphql({
        query: updateStudentMutation,
        variables: { input: formData },
      });
    } catch {
      setValidation("Try Again! (Mark should be a number)");
      return;
    }

    setEditing(false);
    fetchStudents();
    setFormData(initialFormState);
    setstatus("Updated!");
  }

  return (
    <div className="App">
      <div className="form-data">
        <div className={classes.main}>
          <Paper>
            <h1 style={{ marginLeft: 10 }}>My Students</h1>
            <input
              className="input-class"
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (status !== "Editing..") setstatus("");
              }}
              placeholder="Student name"
              value={formData.name}
            />
            <input
              className="input-class"
              onChange={(e) =>
                setFormData({ ...formData, mark1: e.target.value })
              }
              placeholder="Mark1"
              value={formData.mark1}
            />
            <input
              className="input-class"
              onChange={(e) =>
                setFormData({ ...formData, mark2: e.target.value })
              }
              placeholder="Mark2"
              value={formData.mark2}
            />

            {editing === false ? (
              <button className="input-class" onClick={createStudent}>
                Create Student
              </button>
            ) : (
              <button className="input-class" onClick={updateStudent}>
                Update Student
              </button>
            )}
            <p className="validation">{validation}</p>
            <p className="status">{status}</p>
          </Paper>
        </div>
      </div>

      <div className="paper-containers">
        {Students.map((Student) => (
          <div style={{ textAlign: "center" }} key={Student.id || Student.name}>
            <div className={classes.root}>
              <Paper elevation={3}>
                <h4>Name : {Student.name}</h4>
                <p>Mark 1 :{Student.mark1}</p>
                <p>Mark 2 : {Student.mark2}</p>
                <div className="edit-delete-btn">
                  <button
                    disabled={editing}
                    onClick={() => deleteStudent(Student)}
                  >
                    Delete Student
                  </button>
                  <button
                    style={{ marginLeft: 10 }}
                    onClick={() => editStudent(Student)}
                  >
                    Edit Student
                  </button>
                </div>
              </Paper>
            </div>
          </div>
        ))}
      </div>

      <div></div>
    </div>
  );
}

export default App;
